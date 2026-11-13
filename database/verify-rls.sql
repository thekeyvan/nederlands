begin;
insert into auth.users(id,aud,role) values
 ('11111111-1111-4111-8111-111111111111','authenticated','authenticated'),
 ('22222222-2222-4222-8222-222222222222','authenticated','authenticated');
insert into public.review_cards(user_id,card_id,ease,interval_days,repetitions,due,last_reviewed,grade,reviews)
values('22222222-2222-4222-8222-222222222222','rls-other-user',2.5,1,1,now()+interval '1 day',now(),4,1);
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.sync_learning(jsonb_build_object('cards',jsonb_build_array(jsonb_build_object(
'id','rls-own-card','ease',2.5,'interval',1,'repetitions',1,'due',now()+interval '1 day','lastReviewed',now(),'grade',4,'reviews',1)),
'events',jsonb_build_array(jsonb_build_object('id','33333333-3333-4333-8333-333333333333','cardId','rls-own-card','grade',4,'at',now()))));
do $$
begin
 if (select count(*) from public.review_cards) <> 1 then raise exception 'RLS isolation failed'; end if;
 if exists(select 1 from public.review_cards where card_id='rls-other-user') then raise exception 'Other user visible'; end if;
 if (select count(*) from public.review_events)<>1 then raise exception 'Event sync failed'; end if;
 begin
  update public.review_cards set user_id='22222222-2222-4222-8222-222222222222' where card_id='rls-own-card';
  raise exception 'Ownership reassignment was allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
select 'PASS: own writes, other-user isolation, owner protection; all test data rolled back' as verification;
