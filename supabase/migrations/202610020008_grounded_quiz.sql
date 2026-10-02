-- Apply before deploying the grounded quiz worker. Legacy question banks retain 10-item retests.
alter table lp_private.questions add constraint questions_difficulty_check check(difficulty in ('standard','easy','medium','hard'));
alter table lp_private.questions add column quiz_order integer;
alter table lp_private.questions add column question_type text check(question_type in ('concept','compare','scenario','application','cause_effect','sequence','error_identification','best_explanation','reasoning'));
create or replace function public.lp_publish_quiz(p_content uuid,p_owner uuid,p_output jsonb,p_latency integer,p_claim uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare m public.lp_content; q jsonb; ordinal integer := 0; begin
  select * into m from public.lp_content where id=p_content and owner_id=p_owner for update;
  if not found or m.status<>'ready' or p_claim is null or m.quiz_claim is distinct from p_claim then raise exception 'งานแบบทดสอบหมดอายุ'; end if;
  if jsonb_typeof(p_output->'questions') is distinct from 'array' or jsonb_array_length(p_output->'questions')<>20 then raise exception 'ไม่มีข้อมูลเพียงพอสำหรับแบบทดสอบ'; end if;
  if (select count(*) from jsonb_array_elements(p_output->'questions') item where item->>'difficulty'='easy')<>4
    or (select count(*) from jsonb_array_elements(p_output->'questions') item where item->>'difficulty'='medium')<>8
    or (select count(*) from jsonb_array_elements(p_output->'questions') item where item->>'difficulty'='hard')<>8
    or (select count(distinct item->>'questionType') from jsonb_array_elements(p_output->'questions') item)<4
    or exists(select 1 from jsonb_array_elements(p_output->'questions') item where item->'reference'->>'status' is distinct from 'verified')
    or (select count(distinct lower(trim(item->>'prompt'))) from jsonb_array_elements(p_output->'questions') item)<>20
    then raise exception 'แบบทดสอบไม่ผ่านการตรวจคุณภาพ'; end if;
  for q in select value from jsonb_array_elements(p_output->'questions') loop
    if not exists(select 1 from jsonb_array_elements(m.concepts) c where c->>'id'=p_content::text||':'||(q->>'concept_id')) then raise exception 'แนวคิดไม่ตรงกับบทเรียน'; end if;
    insert into lp_private.questions(content_id,concept_id,prompt,choices,correct,explanation,reference,difficulty,question_type,quiz_order)
      values(p_content,p_content::text||':'||(q->>'concept_id'),q->>'prompt',q->'choices',(q->>'correct')::integer,q->>'explanation',q->'reference',q->>'difficulty',q->>'questionType',ordinal);
    ordinal := ordinal + 1;
  end loop;
  update public.lp_content set quiz_claim=null,quiz_error=null where id=p_content;
end $$;

create or replace function public.lp_start_quiz(p_content uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); i uuid; qs jsonb; begin
  perform 1 from public.lp_content where id=p_content and owner_id=u and status='ready' for update;
  if not found then raise exception 'เนื้อหายังไม่พร้อม'; end if;
  select id into i from public.lp_attempts where content_id=p_content and owner_id=u and submitted_at is null;
  if i is not null then return i; end if;
  select jsonb_agg(jsonb_build_object('id',q.id,'concept_id',q.concept_id,'prompt',q.prompt,'choices',q.choices,'difficulty',q.difficulty,'questionType',q.question_type)) into qs from (
    select q.* from lp_private.questions q where content_id=p_content and not withdrawn
    and not exists(select 1 from public.lp_attempts a where owner_id=u and a.content_id=p_content and a.submitted_at is not null
      and a.questions @> jsonb_build_array(jsonb_build_object('id',q.id)))
    order by q.quiz_order, (select coalesce((e->>'correct')::numeric/nullif((e->>'sample')::numeric,0),0) from jsonb_array_elements(lp_private.evidence(u)) e where e->>'id'=q.concept_id),random() limit (case when exists(select 1 from lp_private.questions where content_id=p_content and question_type is not null) then 20 else 10 end)
  ) q;
  if qs is null then raise exception 'คำถามใหม่หมดแล้ว กรุณาเพิ่มเนื้อหาใหม่ ยังไม่รองรับสร้างชุดเพิ่มเติมอัตโนมัติ'; end if;
  insert into public.lp_attempts(owner_id,content_id,questions) values(u,p_content,qs) returning id into i;
  insert into public.lp_analytics(owner_id,event,properties) values(u,'quiz_started',jsonb_build_object('attempt_id',i)); return i;
end $$;




