-- Apply before deploying the updated analyze-content worker.
alter table public.lp_content add column analysis_claim uuid;
drop function public.lp_publish_analysis(uuid,uuid,jsonb,integer);
drop function public.lp_fail_analysis(uuid,uuid,text);
-- Service-role-only worker entry points. Private answer keys never enter public tables.
create or replace function public.lp_claim_analysis(p_content uuid,p_owner uuid,p_model text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare m public.lp_content; begin
  select * into m from public.lp_content where id=p_content and owner_id=p_owner for update;
  if not found then raise exception 'ไม่พบเนื้อหา'; end if;
  if m.status='ready' then return jsonb_build_object('ready',true); end if;
  if m.status in ('extracting','analyzing') and m.claimed_at>now()-interval '5 minutes' then raise exception 'งานนี้กำลังประมวลผล'; end if;
  if m.retry_count>=3 then raise exception 'เกินงบ retry 3 ครั้ง โปรดติดต่อผู้ดูแล'; end if;
  update public.lp_content set status='analyzing',error=null,claimed_at=now(),analysis_claim=gen_random_uuid(),retry_count=retry_count+1,model=p_model,prompt_version='leanpilot-v1' where id=p_content returning * into m;
  return to_jsonb(m);
end $$;

create or replace function public.lp_publish_analysis(p_content uuid,p_owner uuid,p_output jsonb,p_latency integer,p_claim uuid) returns void language plpgsql security definer set search_path = '' as $$
declare m public.lp_content; q jsonb; c jsonb; begin
  select * into m from public.lp_content where id=p_content and owner_id=p_owner for update;
  if not found or m.status<>'analyzing' or p_claim is null or m.analysis_claim is distinct from p_claim then raise exception 'งานวิเคราะห์ไม่อยู่ในสถานะที่เผยแพร่ได้'; end if;
  -- Validate again at the transaction boundary; only service role may call this function.
  if jsonb_array_length(p_output->'concepts')=0 or jsonb_array_length(p_output->'questions')=0 then raise exception 'ไม่มีหลักฐานเพียงพอ'; end if;
  for c in select value from jsonb_array_elements(p_output->'concepts') loop
    c:=jsonb_set(c,'{id}',to_jsonb(p_content::text||':'||(c->>'id')));
    p_output:=jsonb_set(p_output,'{concepts}',(select jsonb_agg(case when value->>'id'=split_part(c->>'id',':',2) then c else value end) from jsonb_array_elements(p_output->'concepts')));
  end loop;
  for q in select value from jsonb_array_elements(p_output->'questions') loop
    insert into lp_private.questions(content_id,concept_id,prompt,choices,correct,explanation,reference)
      values(p_content,p_content::text||':'||(q->>'concept_id'),q->>'prompt',q->'choices',(q->>'correct')::integer,q->>'explanation',q->'reference');
  end loop;
  update public.lp_content set status='ready',summary=p_output->'summary',concepts=p_output->'concepts',latency_ms=p_latency,validation_status='passed' where id=p_content;
  insert into public.lp_analytics(owner_id,event,properties) values(p_owner,'content_ready',jsonb_build_object('content_id',p_content,'latency_ms',p_latency));
end $$;

create or replace function public.lp_fail_analysis(p_content uuid,p_owner uuid,p_error text,p_claim uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.lp_content set status='failed',error=left(p_error,500),validation_status='failed' where id=p_content and owner_id=p_owner and status='analyzing' and analysis_claim=p_claim;
  if found then insert into public.lp_analytics(owner_id,event,properties) values(p_owner,'analysis_failed',jsonb_build_object('content_id',p_content,'error_category','analysis_or_validation')); end if;
end $$;
revoke all on function public.lp_claim_analysis(uuid,uuid,text),public.lp_publish_analysis(uuid,uuid,jsonb,integer,uuid),public.lp_fail_analysis(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.lp_claim_analysis(uuid,uuid,text),public.lp_publish_analysis(uuid,uuid,jsonb,integer,uuid),public.lp_fail_analysis(uuid,uuid,text,uuid) to service_role;

create or replace function public.lp_preferences_save(p_settings jsonb) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); c record; batch text := 'preferences:'||gen_random_uuid(); begin
  if jsonb_typeof(p_settings) is distinct from 'object'
    or jsonb_typeof(p_settings->'minutes') is distinct from 'number'
    or coalesce(p_settings->>'minutes','') !~ '^[0-9]+$'
    or jsonb_typeof(p_settings->'timezone') is distinct from 'string'
    or jsonb_typeof(p_settings->'days') is distinct from 'array'
    or jsonb_typeof(p_settings->'language') is distinct from 'string' then
    raise exception 'Invalid preferences';
  end if;
  if (p_settings->>'minutes')::numeric not between 10 and 180
    or not exists(select 1 from pg_catalog.pg_timezone_names where name=p_settings->>'timezone')
    or jsonb_array_length(p_settings->'days')=0
    or exists(select 1 from jsonb_array_elements(p_settings->'days') d where d::text !~ '^[0-6]$')
    or p_settings->>'language' not in ('th','en') then
    raise exception 'Invalid preferences';
  end if;
  insert into public.lp_preferences values(u,p_settings) on conflict(owner_id) do update set settings=excluded.settings;
  for c in select id from public.lp_courses where owner_id=u and exists(select 1 from public.lp_plans where course_id=lp_courses.id) order by id loop
    perform lp_private.make_plan(u,c.id,batch);
  end loop;
end $$;

revoke all on function public.lp_preferences_save(jsonb) from public,anon;
grant execute on function public.lp_preferences_save(jsonb) to authenticated;
