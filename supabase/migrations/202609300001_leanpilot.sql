-- Apply to a new/staging Supabase project. Existing prototype tables are untouched.
create schema if not exists lp_private;
revoke all on schema lp_private from public, anon, authenticated;

create table public.lp_preferences (
  owner_id uuid primary key references auth.users on delete cascade,
  settings jsonb not null default '{"minutes":30,"timezone":"Asia/Bangkok","days":[0,1,2,3,4,5,6],"language":"th"}'
);
create table public.lp_courses (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade,
  title text not null check (length(title) between 1 and 200), goal text not null default '', target_date date,
  created_at timestamptz not null default now()
);
create table public.lp_content (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade,
  course_id uuid not null references public.lp_courses on delete cascade,
  title text not null, source text not null check (length(source) between 200 and 100000),
  status text not null default 'queued' check (status in ('queued','extracting','analyzing','ready','failed')),
  error text, summary jsonb, concepts jsonb not null default '[]',
  version integer not null default 1, retry_count integer not null default 0,
  model text, prompt_version text, latency_ms integer, validation_status text,
  claimed_at timestamptz, created_at timestamptz not null default now()
);
create table lp_private.questions (
  id uuid primary key default gen_random_uuid(), content_id uuid not null references public.lp_content on delete cascade,
  concept_id text not null, prompt text not null, choices jsonb not null,
  correct integer not null check (correct between 0 and 3), explanation text not null, reference jsonb not null,
  difficulty text not null default 'standard', withdrawn boolean not null default false,
  unique(content_id, prompt), check (jsonb_array_length(choices) = 4)
);
create table public.lp_attempts (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade,
  content_id uuid not null references public.lp_content on delete cascade,
  questions jsonb not null, answers jsonb not null default '{}', result jsonb,
  submitted_at timestamptz, created_at timestamptz not null default now()
);
create unique index lp_one_draft on public.lp_attempts(owner_id,content_id) where submitted_at is null;
create table public.lp_plans (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade,
  course_id uuid not null references public.lp_courses on delete cascade, version integer not null,
  trigger text not null, reason text not null, inputs jsonb not null default '{}', tasks jsonb not null, active boolean not null default true,
  created_at timestamptz not null default now(), unique(owner_id, course_id, version), unique(owner_id, course_id, trigger)
);
create unique index lp_one_active_plan on public.lp_plans(owner_id,course_id) where active;
create table public.lp_activity_events (
  id uuid primary key, owner_id uuid not null references auth.users on delete cascade,
  plan_id uuid references public.lp_plans on delete cascade, task_id uuid not null, status text not null,
  created_at timestamptz not null default now()
);
create table public.lp_issues (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade,
  content_id uuid not null references public.lp_content on delete cascade,
  entity_id text not null, description text not null, review_status text not null default 'pending',
  created_at timestamptz not null default now()
);
create table public.lp_analytics (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade,
  event text not null, properties jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.lp_deletions (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade,
  content_id uuid not null, status text not null default 'completed', completed_at timestamptz not null default now()
);

do $$ declare tbl text; begin
  foreach tbl in array array['lp_preferences','lp_courses','lp_content','lp_attempts','lp_plans','lp_activity_events','lp_issues','lp_analytics','lp_deletions'] loop
    execute format('alter table public.%I enable row level security',tbl);
    execute format('create policy owner_read on public.%I for select to authenticated using (owner_id = auth.uid())',tbl);
    execute format('revoke all on public.%I from anon, authenticated',tbl);
    execute format('grant select on public.%I to authenticated',tbl);
  end loop;
end $$;
-- All mutations go through ownership-checked RPCs. There is no client grant on answer keys.

create function lp_private.require_user() returns uuid language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'กรุณาเข้าสู่ระบบ'; end if;
  return auth.uid();
end $$;

create function lp_private.lock_user() returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.require_user(); begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text,0)); return u;
end $$;

create function lp_private.evidence(p_user uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  with ranked as (
    select a.*, row_number() over(partition by content_id order by submitted_at desc, id) rn
    from public.lp_attempts a where owner_id=p_user and submitted_at is not null
  ), responses as (
    select distinct on(q.id) q.id, q.concept_id, (a.answers->>q.id::text)::integer = q.correct ok
    from ranked a cross join lateral jsonb_array_elements(a.questions) item
    join lp_private.questions q on q.id=(item->>'id')::uuid
    where a.rn<=3 and not q.withdrawn order by q.id,a.submitted_at desc
  ), totals as (
    select concept_id, count(*) sample, count(*) filter(where ok) correct from responses group by concept_id
  )
  select coalesce(jsonb_agg(jsonb_build_object('id',c->>'id','name',c->>'name','sample',coalesce(t.sample,0),'correct',coalesce(t.correct,0),
    'status',case when coalesce(t.sample,0)<3 then 'ยังประเมินไม่เพียงพอ' when t.correct::numeric/t.sample<0.6 then 'ควรทบทวน'
      when t.correct::numeric/t.sample<0.8 then 'กำลังพัฒนา' else 'ทำได้ดีในชุดคำถามนี้' end)), '[]')
  from public.lp_content m cross join lateral jsonb_array_elements(m.concepts) c
  left join totals t on t.concept_id=c->>'id' where m.owner_id=p_user and m.status='ready';
$$;

create function public.lp_snapshot() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare u uuid := lp_private.require_user(); begin
  return jsonb_build_object(
    'preferences',coalesce((select settings from public.lp_preferences where owner_id=u),'{"minutes":30,"timezone":"Asia/Bangkok","days":[0,1,2,3,4,5,6],"language":"th"}'::jsonb),
    'courses',coalesce((select jsonb_agg(to_jsonb(c)-'owner_id' order by created_at) from public.lp_courses c where owner_id=u),'[]'),
    'materials',coalesce((select jsonb_agg(to_jsonb(c)-'owner_id' order by created_at desc) from public.lp_content c where owner_id=u),'[]'),
    'attempts',coalesce((select jsonb_agg(to_jsonb(a)-'owner_id' order by created_at desc) from public.lp_attempts a where owner_id=u),'[]'),
    'plans',coalesce((select jsonb_agg(to_jsonb(p)-'owner_id' order by created_at desc) from public.lp_plans p where owner_id=u and active),'[]'),
    'evidence',lp_private.evidence(u));
end $$;

create function public.lp_create_course(p_title text,p_goal text,p_target date default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); i uuid; begin
  insert into public.lp_courses(owner_id,title,goal,target_date) values(u,trim(p_title),p_goal,p_target) returning id into i; return i;
end $$;

create function public.lp_import(p_course uuid,p_title text,p_source text,p_id uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); begin
  if not exists(select 1 from public.lp_courses where id=p_course and owner_id=u) then raise exception 'ไม่พบวิชา'; end if;
  if exists(select 1 from public.lp_content where id=p_id and owner_id=u) then return p_id; end if;
  if length(trim(p_source))<200 or length(p_source)>100000 then raise exception 'เนื้อหาต้องมี 200–100,000 ตัวอักษร'; end if;
  if length(trim(p_title)) not between 1 and 200 then raise exception 'กรุณาระบุชื่อเนื้อหาไม่เกิน 200 ตัวอักษร'; end if;
  if (select count(*) from public.lp_content where owner_id=u and created_at>now()-interval '1 hour')>=10 then raise exception 'เพิ่มเนื้อหาได้ไม่เกิน 10 รายการต่อชั่วโมง'; end if;
  insert into public.lp_content(id,owner_id,course_id,title,source) values(p_id,u,p_course,p_title,p_source);
  insert into public.lp_analytics(owner_id,event,properties) values(u,'content_import_started',jsonb_build_object('content_id',p_id));
  return p_id;
end $$;

create function public.lp_start_quiz(p_content uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); i uuid; qs jsonb; begin
  perform 1 from public.lp_content where id=p_content and owner_id=u and status='ready' for update;
  if not found then raise exception 'เนื้อหายังไม่พร้อม'; end if;
  select id into i from public.lp_attempts where content_id=p_content and owner_id=u and submitted_at is null;
  if i is not null then return i; end if;
  select jsonb_agg(jsonb_build_object('id',q.id,'concept_id',q.concept_id,'prompt',q.prompt,'choices',q.choices)) into qs from (
    select q.* from lp_private.questions q where content_id=p_content and not withdrawn
    and not exists(select 1 from public.lp_attempts a where owner_id=u and a.content_id=p_content and a.submitted_at is not null
      and a.questions @> jsonb_build_array(jsonb_build_object('id',q.id)))
    order by (select coalesce((e->>'correct')::numeric/nullif((e->>'sample')::numeric,0),0) from jsonb_array_elements(lp_private.evidence(u)) e where e->>'id'=q.concept_id),random() limit 10
  ) q;
  if qs is null then raise exception 'คำถามใหม่หมดแล้ว กรุณาเพิ่มเนื้อหาใหม่ ยังไม่รองรับสร้างชุดเพิ่มเติมอัตโนมัติ'; end if;
  insert into public.lp_attempts(owner_id,content_id,questions) values(u,p_content,qs) returning id into i;
  insert into public.lp_analytics(owner_id,event,properties) values(u,'quiz_started',jsonb_build_object('attempt_id',i)); return i;
end $$;

create function public.lp_save_draft(p_attempt uuid,p_answers jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); a public.lp_attempts; begin
  select * into a from public.lp_attempts where id=p_attempt and owner_id=u for update;
  if not found or a.submitted_at is not null then raise exception 'ไม่พบแบบทดสอบที่แก้ไขได้'; end if;
  if jsonb_typeof(p_answers)<>'object' or exists(select 1 from jsonb_each(p_answers) kv where
    jsonb_typeof(kv.value)<>'number' or kv.value::text !~ '^[0-3]$' or not exists(select 1 from jsonb_array_elements(a.questions) q where q->>'id'=kv.key))
    then raise exception 'คำตอบไม่ถูกต้อง'; end if;
  update public.lp_attempts set answers=p_answers where id=p_attempt;
end $$;

create function lp_private.make_plan(p_user uuid,p_course uuid,p_trigger text) returns uuid language plpgsql security definer set search_path = '' as $$
declare prefs jsonb; old public.lp_plans; tasks jsonb := '[]'; task jsonb; e jsonb; c record;
  d date; start_day date; deadline date; minutes integer; used integer; version_no integer; i uuid; reason text;
begin
  -- Serialize all plans for this course (quiz, preferences, tasks, rollback).
  perform 1 from public.lp_courses where id=p_course and owner_id=p_user for update;
  select id into i from public.lp_plans where owner_id=p_user and course_id=p_course and trigger=p_trigger;
  if i is not null then return i; end if;
  select settings into prefs from public.lp_preferences where owner_id=p_user;
  prefs := coalesce(prefs,'{"minutes":30,"timezone":"Asia/Bangkok","days":[0,1,2,3,4,5,6],"language":"th"}');
  minutes := (prefs->>'minutes')::integer;
  start_day := (now() at time zone (prefs->>'timezone'))::date;
  select coalesce(target_date,start_day+6) into deadline from public.lp_courses where id=p_course;
  deadline := least(deadline,start_day+365);
  select * into old from public.lp_plans where owner_id=p_user and course_id=p_course and active;
  select coalesce(max(version),0)+1 into version_no from public.lp_plans where owner_id=p_user and course_id=p_course;
  -- Keep historical/in-progress/locked tasks. Only unstarted unlocked tasks may change.
  if old.id is not null then
    select coalesce(jsonb_agg(t),'[]') into tasks from jsonb_array_elements(old.tasks) t
      where t->>'status'<>'pending' or (t->>'locked')::boolean;
  end if;
  for c in select m.id content_id, concept from public.lp_content m cross join lateral jsonb_array_elements(m.concepts) concept
    where m.owner_id=p_user and m.course_id=p_course and m.status='ready'
    order by (select case when (ev->>'sample')::integer>=3 and (ev->>'correct')::numeric/(ev->>'sample')::numeric<0.6 then 0
      when (ev->>'sample')::integer<3 then 1 when (ev->>'correct')::numeric/(ev->>'sample')::numeric<0.8 then 2 else 3 end
      from jsonb_array_elements(lp_private.evidence(p_user)) ev where ev->>'id'=concept->>'id')
  loop
    select ev into e from jsonb_array_elements(lp_private.evidence(p_user)) ev where ev->>'id'=c.concept->>'id';
    reason := format('%s: ตอบถูก %s จาก %s ข้อ — %s',c.concept->>'name',e->>'correct',e->>'sample',e->>'status');
    if exists(select 1 from jsonb_array_elements(tasks) t where t->>'concept_id'=c.concept->>'id' and (t->>'status'='in_progress' or (t->>'locked')::boolean and t->>'status'='pending')) then continue; end if;
    for task in select jsonb_build_object('id',gen_random_uuid(),'content_id',c.content_id,'concept_id',c.concept->>'id',
      'title',kind||' · '||(c.concept->>'name'),'date',null,'minutes',duration,'status','pending','locked',false,'reason',reason,'kind',k)
      from (values('ทบทวน','review',15),('ทดสอบใหม่','quiz',10)) v(kind,k,duration)
    loop
      d := start_day;
      while d<=deadline loop
        select coalesce(sum((t->>'minutes')::integer),0) into used from (
          select value t from jsonb_array_elements(tasks)
          union all select t from public.lp_plans p cross join lateral jsonb_array_elements(p.tasks) t where p.owner_id=p_user and p.active and p.course_id<>p_course
            and (p_trigger not like 'preferences:%' or p.trigger=p_trigger or t->>'status'<>'pending' or (t->>'locked')::boolean)
        ) all_tasks where t->>'date'=d::text and t->>'status'<>'skipped';
        if prefs->'days' @> to_jsonb(extract(dow from d)::integer) and used+(task->>'minutes')::integer<=minutes then exit; end if;
        d := d+1;
      end loop;
      if d<=deadline then task := jsonb_set(task,'{date}',to_jsonb(d::text)); end if;
      tasks := tasks||jsonb_build_array(task);
    end loop;
  end loop;
  update public.lp_plans set active=false where id=old.id;
  insert into public.lp_plans(owner_id,course_id,version,trigger,reason,inputs,tasks) values(p_user,p_course,version_no,p_trigger,
    'จัดลำดับตามหลักฐานล่าสุด จำกัดเวลาตามวันที่เรียน รายการที่เวลาไม่พออยู่ในรายการรอจัด',
    jsonb_build_object('preferences',prefs,'start_date',start_day,'target_date',deadline,'evidence',lp_private.evidence(p_user)),tasks) returning id into i;
  insert into public.lp_analytics(owner_id,event,properties) values(p_user,case when old.id is null then 'plan_created' else 'plan_adjusted' end,jsonb_build_object('plan_id',i,'version',version_no,'trigger',p_trigger));
  return i;
end $$;

create function public.lp_submit_quiz(p_attempt uuid,p_answers jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); a public.lp_attempts; r jsonb; course uuid; task jsonb; plan uuid; begin
  select course_id into course from public.lp_content m join public.lp_attempts atp on atp.content_id=m.id where atp.id=p_attempt and atp.owner_id=u;
  perform 1 from public.lp_courses where id=course and owner_id=u for update;
  select * into a from public.lp_attempts where id=p_attempt and owner_id=u for update;
  if not found then raise exception 'ไม่พบแบบทดสอบ'; end if;
  if a.submitted_at is not null then return a.result; end if;
  perform public.lp_save_draft(p_attempt,p_answers);
  if exists(select 1 from jsonb_array_elements(a.questions) q where not p_answers ? (q->>'id')) then raise exception 'กรุณาตอบครบทุกข้อ'; end if;
  if exists(select 1 from jsonb_array_elements(a.questions) q join lp_private.questions k on k.id=(q->>'id')::uuid where k.withdrawn) then raise exception 'มีคำถามถูกถอน กรุณาเริ่มชุดใหม่'; end if;
  select jsonb_build_object('score',count(*) filter(where (p_answers->>q.id::text)::integer=q.correct),'total',count(*),
    'feedback',jsonb_agg(jsonb_build_object('question_id',q.id,'prompt',q.prompt,'choices',q.choices,'selected',(p_answers->>q.id::text)::integer,
      'correct',q.correct,'explanation',q.explanation,'reference',q.reference,'concept_id',q.concept_id))) into r
    from jsonb_array_elements(a.questions) item join lp_private.questions q on q.id=(item->>'id')::uuid;
  update public.lp_attempts set answers=p_answers,result=r,submitted_at=now() where id=p_attempt;
  select id into plan from public.lp_plans where owner_id=u and course_id=course and active;
  for task in select t from public.lp_plans p cross join lateral jsonb_array_elements(p.tasks) t
    where p.id=plan and t->>'content_id'=a.content_id::text and t->>'kind'='quiz' and t->>'status'='in_progress' loop
    perform public.lp_task_event(gen_random_uuid(),plan,(task->>'id')::uuid,'completed');
  end loop;
  perform lp_private.make_plan(u,course,'attempt:'||p_attempt);
  insert into public.lp_analytics(owner_id,event,properties) values(u,'quiz_submitted',jsonb_build_object('attempt_id',p_attempt,'score',r->'score','total',r->'total'));
  if exists(select 1 from public.lp_activity_events ev join public.lp_plans p on p.id=ev.plan_id cross join lateral jsonb_array_elements(p.tasks) t where ev.owner_id=u and p.course_id=course and ev.status='completed' and t->>'id'=ev.task_id::text and t->>'content_id'=a.content_id::text and t->>'kind'='review' and ev.created_at>a.created_at-interval '7 days' and ev.created_at<=now()) then
    insert into public.lp_analytics(owner_id,event,properties) values(u,'learning_cycle_completed',jsonb_build_object('attempt_id',p_attempt));
  end if;
  return r;
end $$;

create function public.lp_preferences_save(p_settings jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); c record; batch text := 'preferences:'||gen_random_uuid(); begin
  if (p_settings->>'minutes')::integer not between 10 and 180 or not exists(select 1 from pg_catalog.pg_timezone_names where name=p_settings->>'timezone')
    or jsonb_typeof(p_settings->'days')<>'array' or jsonb_array_length(p_settings->'days')=0
    or exists(select 1 from jsonb_array_elements(p_settings->'days') d where d::text !~ '^[0-6]$') or p_settings->>'language' not in ('th','en')
    or not p_settings ?& array['minutes','timezone','days','language'] then raise exception 'เวลา วันเรียน หรือ timezone ไม่ถูกต้อง'; end if;
  insert into public.lp_preferences values(u,p_settings) on conflict(owner_id) do update set settings=excluded.settings;
  for c in select id from public.lp_courses where owner_id=u and exists(select 1 from public.lp_plans where course_id=lp_courses.id) order by id loop
    perform lp_private.make_plan(u,c.id,batch);
  end loop;
end $$;

create function public.lp_task_event(p_event uuid,p_plan uuid,p_task uuid,p_status text) returns boolean language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); p public.lp_plans; t jsonb; ts jsonb; course uuid; begin
  if p_status not in ('pending','in_progress','completed','skipped') then raise exception 'สถานะไม่ถูกต้อง'; end if;
  if exists(select 1 from public.lp_activity_events where id=p_event and owner_id=u) then return true; end if;
  select course_id into course from public.lp_plans where id=p_plan and owner_id=u;
  perform 1 from public.lp_courses where id=course and owner_id=u for update;
  select * into p from public.lp_plans where course_id=course and owner_id=u and active for update;
  select item into t from jsonb_array_elements(p.tasks) item where item->>'id'=p_task::text;
  if t is null and p_status='completed' then
    select item into t from public.lp_plans previous cross join lateral jsonb_array_elements(previous.tasks) item
      where previous.id=p_plan and previous.owner_id=u and item->>'id'=p_task::text;
    if t is not null then
      -- Preserve offline completion from a replaced task; retire its pending replacement.
      p.tasks := (select coalesce(jsonb_agg(item),'[]') from jsonb_array_elements(p.tasks) item
        where not (item->>'status'='pending' and not (item->>'locked')::boolean and item->>'concept_id'=t->>'concept_id' and item->>'kind'=t->>'kind')) || jsonb_build_array(t);
    end if;
  end if;
  if t is null then return false; end if;
  -- Completion survives a stale event, and cannot be overwritten by a later skip.
  if t->>'status'='completed' then p_status:='completed'; end if;
  select jsonb_agg(case when item->>'id'=p_task::text then jsonb_set(item,'{status}',to_jsonb(p_status)) else item end) into ts from jsonb_array_elements(p.tasks) item;
  update public.lp_plans set tasks=ts where id=p.id;
  insert into public.lp_activity_events(id,owner_id,plan_id,task_id,status) values(p_event,u,p.id,p_task,p_status) on conflict do nothing;
  if p_status='completed' then insert into public.lp_analytics(owner_id,event,properties) values(u,'study_task_completed',jsonb_build_object('task_id',p_task)); end if;
  return p.id=p_plan;
end $$;

create function public.lp_task_edit(p_plan uuid,p_task uuid,p_date date,p_locked boolean) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); p public.lp_plans; t jsonb; used integer; prefs jsonb; begin
  perform 1 from public.lp_courses where id=(select course_id from public.lp_plans where id=p_plan and owner_id=u) and owner_id=u for update;
  select * into p from public.lp_plans where id=p_plan and owner_id=u and active for update;
  select item into t from jsonb_array_elements(p.tasks) item where item->>'id'=p_task::text;
  if t is null or t->>'status'<>'pending' then raise exception 'เลื่อนหรือล็อกได้เฉพาะกิจกรรมที่ยังไม่เริ่ม'; end if;
  select settings into prefs from public.lp_preferences where owner_id=u;
  prefs:=coalesce(prefs,'{"minutes":30,"timezone":"Asia/Bangkok","days":[0,1,2,3,4,5,6]}');
  if p_date is not null then
    select coalesce(sum((item->>'minutes')::integer),0) into used from public.lp_plans plan cross join lateral jsonb_array_elements(plan.tasks) item where plan.owner_id=u and plan.active and item->>'date'=p_date::text and item->>'id'<>p_task::text and item->>'status'<>'skipped';
    if used+(t->>'minutes')::integer>(prefs->>'minutes')::integer or not prefs->'days' @> to_jsonb(extract(dow from p_date)::integer) then raise exception 'วันนี้มีเวลาไม่เพียงพอหรือไม่ได้ตั้งเป็นวันเรียน'; end if;
  end if;
  update public.lp_plans set tasks=(select jsonb_agg(case when item->>'id'=p_task::text then item||jsonb_build_object('date',p_date,'locked',p_locked) else item end) from jsonb_array_elements(p.tasks) item) where id=p.id;
end $$;

create function public.lp_undo_plan(p_plan uuid) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); p public.lp_plans; prev uuid; prefs jsonb; begin
  perform 1 from public.lp_courses where id=(select course_id from public.lp_plans where id=p_plan and owner_id=u) and owner_id=u for update;
  select * into p from public.lp_plans where id=p_plan and owner_id=u and active for update;
  if not found then raise exception 'ไม่พบแผนล่าสุด'; end if;
  if exists(select 1 from public.lp_activity_events where plan_id=p.id and created_at>=p.created_at) then raise exception 'ย้อนกลับไม่ได้หลังเริ่มกิจกรรมในแผนนี้'; end if;
  select id into prev from public.lp_plans where owner_id=u and course_id=p.course_id and version<p.version order by version desc limit 1;
  if prev is null then raise exception 'ไม่มีแผนก่อนหน้า'; end if;
  select settings into prefs from public.lp_preferences where owner_id=u;
  prefs:=coalesce(prefs,'{"minutes":30,"days":[0,1,2,3,4,5,6]}');
  if exists(select 1 from public.lp_plans plan cross join lateral jsonb_array_elements(plan.tasks) t
    where plan.owner_id=u and (plan.id=prev or plan.active and plan.course_id<>p.course_id) and t->>'date' is not null and t->>'status' in ('pending','in_progress')
    group by t->>'date' having sum((t->>'minutes')::integer)>(prefs->>'minutes')::integer)
    then raise exception 'แผนก่อนหน้าเกินเวลาว่างปัจจุบัน กรุณาปรับเวลาว่างก่อนย้อนกลับ'; end if;
  update public.lp_plans set active=false where id=p.id;
  update public.lp_plans set active=true where id=prev;
end $$;

create function public.lp_delete_content(p_content uuid) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); begin
  if not exists(select 1 from public.lp_content where id=p_content and owner_id=u) then raise exception 'ไม่พบเนื้อหา'; end if;
  delete from public.lp_activity_events ev where ev.owner_id=u and exists(
    select 1 from public.lp_plans p cross join lateral jsonb_array_elements(p.tasks) t where p.owner_id=u and t->>'content_id'=p_content::text and t->>'id'=ev.task_id::text);
  delete from public.lp_analytics where owner_id=u and (properties->>'content_id'=p_content::text
    or properties->>'attempt_id' in (select id::text from public.lp_attempts where content_id=p_content and owner_id=u));
  update public.lp_plans set tasks=(select coalesce(jsonb_agg(t),'[]') from jsonb_array_elements(tasks) t where t->>'content_id'<>p_content::text),
    inputs=case when inputs ? 'evidence' then jsonb_set(inputs,'{evidence}',(select coalesce(jsonb_agg(e),'[]') from jsonb_array_elements(inputs->'evidence') e where e->>'id' not like p_content::text||':%')) else inputs end where owner_id=u;
  delete from public.lp_content where id=p_content and owner_id=u;
  insert into public.lp_deletions(owner_id,content_id) values(u,p_content);
end $$;

create function public.lp_report(p_content uuid,p_entity text,p_description text) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); begin
  if not exists(select 1 from public.lp_content where id=p_content and owner_id=u) or length(trim(p_description)) not between 1 and 2000 then raise exception 'รายงานไม่ถูกต้อง'; end if;
  insert into public.lp_issues(owner_id,content_id,entity_id,description) values(u,p_content,p_entity,p_description);
  insert into public.lp_analytics(owner_id,event,properties) values(u,'content_issue_reported',jsonb_build_object('content_id',p_content));
end $$;

-- Functions are executable by their intended role only (Postgres defaults to PUBLIC).
do $$ declare f record; begin
  for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'lp_%' loop
    execute format('revoke all on function %s from public, anon',f.signature);
    execute format('grant execute on function %s to authenticated',f.signature);
  end loop;
end $$;
revoke all on all functions in schema lp_private from public, anon, authenticated;
grant usage on schema lp_private to service_role;
grant all on all tables in schema lp_private to service_role;
