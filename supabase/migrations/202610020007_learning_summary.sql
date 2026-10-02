-- Deploy before the summary-first worker. Existing summaries and quizzes remain usable.
alter table public.lp_content add column quiz_claim uuid;
alter table public.lp_content add column quiz_claimed_at timestamptz;
alter table public.lp_content add column quiz_error text;

create function public.lp_publish_summary(p_content uuid,p_owner uuid,p_output jsonb,p_latency integer,p_claim uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare m public.lp_content; cs jsonb; begin
  select * into m from public.lp_content where id=p_content and owner_id=p_owner for update;
  if not found or m.status<>'analyzing' or p_claim is null or m.analysis_claim is distinct from p_claim then raise exception 'งานสรุปไม่อยู่ในสถานะที่เผยแพร่ได้'; end if;
  if coalesce(length(trim(p_output->'summary'->>'overview')),0)=0
    or jsonb_typeof(p_output->'summary'->'points') is distinct from 'array'
    or jsonb_array_length(p_output->'summary'->'points')=0
    or jsonb_typeof(p_output->'concepts') is distinct from 'array'
    or p_output->'questions' is distinct from '[]'::jsonb then raise exception 'รูปแบบสรุปไม่ถูกต้อง'; end if;
  select coalesce(jsonb_agg(jsonb_set(value,'{id}',to_jsonb(p_content::text||':'||(value->>'id')))),'[]'::jsonb) into cs from jsonb_array_elements(p_output->'concepts');
  update public.lp_content set status='ready',error=null,summary=p_output->'summary',concepts=cs,latency_ms=p_latency,
    prompt_version='learning-summary-v2',validation_status=case when jsonb_array_length(coalesce(p_output->'summary'->'verification_warnings','[]'))>0 then 'source_warning' else 'passed' end where id=p_content;
  insert into public.lp_analytics(owner_id,event,properties) values(p_owner,'content_ready',jsonb_build_object('content_id',p_content,'latency_ms',p_latency));
end $$;

create function public.lp_claim_quiz(p_content uuid,p_owner uuid,p_model text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare m public.lp_content; begin
  select * into m from public.lp_content where id=p_content and owner_id=p_owner for update;
  if not found or m.status<>'ready' or m.summary is null then raise exception 'กรุณารอให้สรุปบทเรียนเสร็จก่อน'; end if;
  if exists(select 1 from lp_private.questions where content_id=p_content and not withdrawn) then return jsonb_build_object('ready',true); end if;
  if m.quiz_claim is not null and m.quiz_claimed_at>now()-interval '5 minutes' then raise exception 'กำลังสร้างแบบทดสอบ กรุณารอสักครู่'; end if;
  update public.lp_content set quiz_claim=gen_random_uuid(),quiz_claimed_at=now(),quiz_error=null where id=p_content returning * into m;
  return to_jsonb(m)||jsonb_build_object('analysis_claim',m.quiz_claim);
end $$;

create function public.lp_publish_quiz(p_content uuid,p_owner uuid,p_output jsonb,p_latency integer,p_claim uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare m public.lp_content; q jsonb; begin
  select * into m from public.lp_content where id=p_content and owner_id=p_owner for update;
  if not found or m.status<>'ready' or p_claim is null or m.quiz_claim is distinct from p_claim then raise exception 'งานแบบทดสอบหมดอายุ'; end if;
  if jsonb_typeof(p_output->'questions') is distinct from 'array' or jsonb_array_length(p_output->'questions')=0 then raise exception 'ไม่มีข้อมูลเพียงพอสำหรับแบบทดสอบ'; end if;
  for q in select value from jsonb_array_elements(p_output->'questions') loop
    if not exists(select 1 from jsonb_array_elements(m.concepts) c where c->>'id'=p_content::text||':'||(q->>'concept_id')) then raise exception 'แนวคิดไม่ตรงกับบทเรียน'; end if;
    insert into lp_private.questions(content_id,concept_id,prompt,choices,correct,explanation,reference)
      values(p_content,p_content::text||':'||(q->>'concept_id'),q->>'prompt',q->'choices',(q->>'correct')::integer,q->>'explanation',q->'reference');
  end loop;
  update public.lp_content set quiz_claim=null,quiz_error=null where id=p_content;
end $$;

create function public.lp_fail_quiz(p_content uuid,p_owner uuid,p_error text,p_claim uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.lp_content set quiz_claim=null,quiz_error=left(p_error,500) where id=p_content and owner_id=p_owner and quiz_claim=p_claim;
end $$;
revoke all on function public.lp_publish_summary(uuid,uuid,jsonb,integer,uuid),public.lp_claim_quiz(uuid,uuid,text),public.lp_publish_quiz(uuid,uuid,jsonb,integer,uuid),public.lp_fail_quiz(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.lp_publish_summary(uuid,uuid,jsonb,integer,uuid),public.lp_claim_quiz(uuid,uuid,text),public.lp_publish_quiz(uuid,uuid,jsonb,integer,uuid),public.lp_fail_quiz(uuid,uuid,text,uuid) to service_role;
