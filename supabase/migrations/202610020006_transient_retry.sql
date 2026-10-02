-- Requires migration 005 and its matching worker.
-- Refund only the latest known provider outage, not earlier generation failures.
update public.lp_content
set retry_count=greatest(retry_count-1,0),
    error='บริการ Gemini ไม่พร้อมชั่วคราว (HTTP 503) คืนสิทธิ์ลองใหม่แล้ว กรุณารอสักครู่'
where status='failed' and error ~ '^Gemini HTTP 503($|:)';

create or replace function public.lp_fail_analysis(p_content uuid,p_owner uuid,p_error text,p_claim uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare transient boolean := coalesce(p_error ~ '^Gemini HTTP 503($|:)',false);
begin
  update public.lp_content
  set status='failed',
      error=case when transient then 'บริการ Gemini ไม่พร้อมชั่วคราว (HTTP 503) กรุณารอสักครู่แล้วลองใหม่ ไม่หักโควตา retry' else left(p_error,500) end,
      retry_count=case when transient then greatest(retry_count-1,0) else retry_count end,
      validation_status='failed'
  where id=p_content and owner_id=p_owner and status='analyzing' and analysis_claim=p_claim;
  if found then
    insert into public.lp_analytics(owner_id,event,properties)
    values(p_owner,'analysis_failed',jsonb_build_object('content_id',p_content,
      'error_category',case when transient then 'provider_unavailable' else 'analysis_or_validation' end));
  end if;
end $$;
revoke all on function public.lp_fail_analysis(uuid,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.lp_fail_analysis(uuid,uuid,text,uuid) to service_role;
