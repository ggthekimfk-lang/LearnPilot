-- Apply after 008. No provider calls or question regeneration.
create or replace function lp_private.quiz_available(p_user uuid,p_content uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.lp_attempts where owner_id=p_user and content_id=p_content and submitted_at is null)
    or exists(select 1 from lp_private.questions q where q.content_id=p_content and not q.withdrawn
      and not exists(select 1 from public.lp_attempts a where a.owner_id=p_user and a.content_id=p_content
        and a.submitted_at is not null and a.questions @> jsonb_build_array(jsonb_build_object('id',q.id))));
$$;
revoke all on function lp_private.quiz_available(uuid,uuid) from public,anon,authenticated;

create or replace function lp_private.make_plan(p_user uuid,p_course uuid,p_trigger text) returns uuid language plpgsql security definer set search_path = '' as $$
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
  -- Retire unavailable active quiz tasks, including locked tasks; preserve history.
  select coalesce(jsonb_agg(case when t->>'kind'='quiz' and t->>'status' in ('pending','in_progress')
    and not lp_private.quiz_available(p_user,(t->>'content_id')::uuid)
    then t || jsonb_build_object('status','skipped','locked',false,'reason','ใช้คำถามครบแล้ว — ยังทบทวนบทเรียนและอ่านเฉลยได้') else t end),'[]')
    into tasks from jsonb_array_elements(tasks) t;
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
      where k='review' or lp_private.quiz_available(p_user,c.content_id)
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

create or replace function public.lp_snapshot() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare u uuid := lp_private.require_user(); begin
  return jsonb_build_object(
    'preferences',coalesce((select settings from public.lp_preferences where owner_id=u),'{"minutes":30,"timezone":"Asia/Bangkok","days":[0,1,2,3,4,5,6],"language":"th"}'::jsonb),
    'courses',coalesce((select jsonb_agg(to_jsonb(c)-'owner_id' order by created_at) from public.lp_courses c where owner_id=u),'[]'),
    'materials',coalesce((select jsonb_agg((to_jsonb(c)-'owner_id') || jsonb_build_object('quiz_available',lp_private.quiz_available(u,c.id) or not exists(select 1 from lp_private.questions q where q.content_id=c.id)) order by created_at desc) from public.lp_content c where owner_id=u),'[]'),
    'attempts',coalesce((select jsonb_agg(to_jsonb(a)-'owner_id' order by created_at desc) from public.lp_attempts a where owner_id=u),'[]'),
    'plans',coalesce((select jsonb_agg(to_jsonb(p)-'owner_id' order by created_at desc) from public.lp_plans p where owner_id=u and active),'[]'),
    'evidence',lp_private.evidence(u));
end $$;


-- Repair existing active plans under the same user lock used by RPCs.
do $$ declare item record; begin
  for item in select distinct p.owner_id,p.course_id from public.lp_plans p
    cross join lateral jsonb_array_elements(p.tasks) t where p.active
    and t->>'kind'='quiz' and t->>'status' in ('pending','in_progress')
    and not lp_private.quiz_available(p.owner_id,(t->>'content_id')::uuid)
  loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(item.owner_id::text,0));
    perform lp_private.make_plan(item.owner_id,item.course_id,'quiz-availability:009');
  end loop;
end $$;

create or replace function public.lp_undo_plan(p_plan uuid) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); p public.lp_plans; prev uuid; prefs jsonb; begin
  perform 1 from public.lp_courses where id=(select course_id from public.lp_plans where id=p_plan and owner_id=u) and owner_id=u for update;
  select * into p from public.lp_plans where id=p_plan and owner_id=u and active for update;
  if not found then raise exception 'ไม่พบแผนล่าสุด'; end if;
  if exists(select 1 from public.lp_activity_events where plan_id=p.id and created_at>=p.created_at) then raise exception 'ย้อนกลับไม่ได้หลังเริ่มกิจกรรมในแผนนี้'; end if;
  select id into prev from public.lp_plans where owner_id=u and course_id=p.course_id and version<p.version order by version desc limit 1;
  if prev is null then raise exception 'ไม่มีแผนก่อนหน้า'; end if;
  if exists(select 1 from public.lp_plans plan cross join lateral jsonb_array_elements(plan.tasks) t
    where plan.id=prev and t->>'kind'='quiz' and t->>'status' in ('pending','in_progress')
    and not lp_private.quiz_available(u,(t->>'content_id')::uuid))
    then raise exception 'ย้อนกลับไม่ได้ เพราะแผนก่อนหน้ามีแบบทดสอบที่ใช้คำถามครบแล้ว'; end if;
  select settings into prefs from public.lp_preferences where owner_id=u;
  prefs:=coalesce(prefs,'{"minutes":30,"days":[0,1,2,3,4,5,6]}');
  if exists(select 1 from public.lp_plans plan cross join lateral jsonb_array_elements(plan.tasks) t
    where plan.owner_id=u and (plan.id=prev or plan.active and plan.course_id<>p.course_id) and t->>'date' is not null and t->>'status' in ('pending','in_progress')
    group by t->>'date' having sum((t->>'minutes')::integer)>(prefs->>'minutes')::integer)
    then raise exception 'แผนก่อนหน้าเกินเวลาว่างปัจจุบัน กรุณาปรับเวลาว่างก่อนย้อนกลับ'; end if;
  update public.lp_plans set active=false where id=p.id;
  update public.lp_plans set active=true where id=prev;
end $$;

