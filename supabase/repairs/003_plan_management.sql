-- Recovery for an existing or partially installed migration 003. Keeps data and function identities.
BEGIN;
create or replace function public.lp_rebalance() returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); p record; today date; begin
  today := (now() at time zone coalesce((select settings->>'timezone' from public.lp_preferences where owner_id=u),'Asia/Bangkok'))::date;
  for p in select plan.course_id from public.lp_plans plan where plan.owner_id=u and plan.active
    and exists(select 1 from jsonb_array_elements(plan.tasks) t where t->>'status'='pending' and not (t->>'locked')::boolean and (t->>'date')::date<today) order by plan.course_id loop
    perform lp_private.make_plan(u,p.course_id,'missed:'||today);
  end loop;
end $$;
create or replace function public.lp_course_edit(p_course uuid,p_goal text,p_target date) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.lock_user(); begin
  update public.lp_courses set goal=p_goal,target_date=p_target where id=p_course and owner_id=u;
  if not found then raise exception 'ไม่พบวิชา'; end if;
  if exists(select 1 from public.lp_plans where course_id=p_course and owner_id=u) then
    perform lp_private.make_plan(u,p_course,'goal:'||gen_random_uuid());
  end if;
end $$;
revoke all on function public.lp_rebalance(),public.lp_course_edit(uuid,text,date) from public,anon;
grant execute on function public.lp_rebalance(),public.lp_course_edit(uuid,text,date) to authenticated;

create or replace function public.lp_summary_viewed(p_content uuid) returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := lp_private.require_user(); begin
  if not exists(select 1 from public.lp_content where id=p_content and owner_id=u and status='ready') then raise exception 'ไม่พบสรุป'; end if;
  if not exists(select 1 from public.lp_analytics where owner_id=u and event='summary_viewed' and properties->>'content_id'=p_content::text and created_at>now()-interval '1 hour') then
    insert into public.lp_analytics(owner_id,event,properties) values(u,'summary_viewed',jsonb_build_object('content_id',p_content));
  end if;
end $$;
revoke all on function public.lp_summary_viewed(uuid) from public,anon;
grant execute on function public.lp_summary_viewed(uuid) to authenticated;

COMMIT;

