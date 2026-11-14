-- Lets a signed-in learner delete their account and everything stored with it.
-- Deleting the auth user cascades to review_cards, review_events and learning_preferences.
-- Required by the App Store (guideline 5.1.1(v)) and offered on the website too.
begin;
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare owner uuid := auth.uid();
begin
 if owner is null then raise exception 'Authentication required'; end if;
 delete from public.review_events where user_id = owner;
 delete from public.review_cards where user_id = owner;
 delete from public.learning_preferences where user_id = owner;
 delete from auth.users where id = owner;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
commit;
