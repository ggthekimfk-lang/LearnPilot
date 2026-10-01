-- Administrative endpoint: never granted to authenticated/anon.
create function public.lp_withdraw_question(p_question uuid,p_reason text) returns void language plpgsql security definer set search_path = '' as $$
declare q lp_private.questions; a record; feedback jsonb; score integer; total integer; owner record; begin
  select * into q from lp_private.questions where id=p_question for update;
  if not found then raise exception 'Question not found'; end if;
  if q.withdrawn then return; end if;
  update lp_private.questions set withdrawn=true where id=p_question;
  update public.lp_issues set review_status='confirmed' where entity_id=p_question::text;
  for owner in select distinct owner_id from public.lp_attempts where content_id=q.content_id order by owner_id loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner.owner_id::text,0));
    -- Discard drafts that contain a withdrawn item; a fresh quiz can be started safely.
    delete from public.lp_attempts where owner_id=owner.owner_id and content_id=q.content_id and submitted_at is null
      and questions @> jsonb_build_array(jsonb_build_object('id',p_question));
    for a in select * from public.lp_attempts where owner_id=owner.owner_id and content_id=q.content_id and submitted_at is not null loop
      select coalesce(jsonb_agg(f),'[]') into feedback from jsonb_array_elements(a.result->'feedback') f
        where not exists(select 1 from lp_private.questions k where k.id=(f->>'question_id')::uuid and k.withdrawn);
      select count(*) filter(where f->>'selected'=f->>'correct'),count(*) into score,total from jsonb_array_elements(feedback) f;
      update public.lp_attempts set result=jsonb_build_object('score',score,'total',total,'feedback',feedback,
        'withdrawn_count',jsonb_array_length(a.questions)-total,'notice','มีคำถามถูกถอนและคำนวณคะแนนใหม่แล้ว') where id=a.id;
    end loop;
    perform lp_private.make_plan(owner.owner_id,(select course_id from public.lp_content where id=q.content_id),'withdrawn:'||p_question);
    insert into public.lp_analytics(owner_id,event,properties) values(owner.owner_id,'question_withdrawn',jsonb_build_object('question_id',p_question));
  end loop;
  -- A reason is recorded on the issue queue for audit, not sent to analytics.
  insert into public.lp_issues(owner_id,content_id,entity_id,description,review_status)
    select owner_id,q.content_id,p_question::text,left(p_reason,2000),'confirmed' from public.lp_content where id=q.content_id;
end $$;
revoke all on function public.lp_withdraw_question(uuid,text) from public,anon,authenticated;
grant execute on function public.lp_withdraw_question(uuid,text) to service_role;
