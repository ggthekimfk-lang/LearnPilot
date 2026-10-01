-- Service-role-only worker entry points. Private answer keys never enter public tables.
create function public.lp_claim_analysis(p_content uuid,p_owner uuid,p_model text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare m public.lp_content; begin
  select * into m from public.lp_content where id=p_content and owner_id=p_owner for update;
  if not found then raise exception 'ไม่พบเนื้อหา'; end if;
  if m.status='ready' then return jsonb_build_object('ready',true); end if;
  if m.status in ('extracting','analyzing') and m.claimed_at>now()-interval '5 minutes' then raise exception 'งานนี้กำลังประมวลผล'; end if;
  if m.retry_count>=3 then raise exception 'เกินงบ retry 3 ครั้ง โปรดติดต่อผู้ดูแล'; end if;
  update public.lp_content set status='analyzing',error=null,claimed_at=now(),retry_count=retry_count+1,model=p_model,prompt_version='leanpilot-v1' where id=p_content;
  return to_jsonb(m);
end $$;

create function public.lp_publish_analysis(p_content uuid,p_owner uuid,p_output jsonb,p_latency integer) returns void language plpgsql security definer set search_path = '' as $$
declare m public.lp_content; q jsonb; c jsonb; begin
  select * into m from public.lp_content where id=p_content and owner_id=p_owner for update;
  if not found or m.status<>'analyzing' then raise exception 'งานวิเคราะห์ไม่อยู่ในสถานะที่เผยแพร่ได้'; end if;
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

create function public.lp_fail_analysis(p_content uuid,p_owner uuid,p_error text) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.lp_content set status='failed',error=left(p_error,500),validation_status='failed' where id=p_content and owner_id=p_owner and status='analyzing';
  if found then insert into public.lp_analytics(owner_id,event,properties) values(p_owner,'analysis_failed',jsonb_build_object('content_id',p_content,'error_category','analysis_or_validation')); end if;
end $$;
revoke all on function public.lp_claim_analysis(uuid,uuid,text),public.lp_publish_analysis(uuid,uuid,jsonb,integer),public.lp_fail_analysis(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.lp_claim_analysis(uuid,uuid,text),public.lp_publish_analysis(uuid,uuid,jsonb,integer),public.lp_fail_analysis(uuid,uuid,text) to service_role;
