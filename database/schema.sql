begin;
create table public.review_cards (
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 card_id text not null check (length(card_id) between 1 and 160),
 ease numeric not null check (ease between 1.3 and 10),
 interval_days integer not null check (interval_days between 1 and 36500),
 repetitions integer not null check (repetitions between 0 and 10000),
 due timestamptz not null,
 last_reviewed timestamptz not null,
 grade integer not null check (grade in (1,3,4,5)),
 reviews integer not null check (reviews between 1 and 100000),
 primary key (user_id,card_id)
);
create table public.review_events (
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 id uuid not null,
 card_id text not null check (length(card_id) between 1 and 160),
 grade integer not null check (grade in (1,3,4,5)),
 reviewed_at timestamptz not null,
 primary key (user_id,id)
);
create index review_events_user_time on public.review_events(user_id,reviewed_at desc);
create table public.learning_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
 data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object' and octet_length(data::text)<100000),
 updated_at timestamptz not null default now()
);
alter table public.review_cards enable row level security;
alter table public.review_events enable row level security;
alter table public.learning_preferences enable row level security;
create policy "Read own cards" on public.review_cards for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own cards" on public.review_cards for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own cards" on public.review_cards for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Read own events" on public.review_events for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own events" on public.review_events for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Read own preferences" on public.learning_preferences for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own preferences" on public.learning_preferences for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own preferences" on public.learning_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
revoke all on public.review_cards,public.review_events,public.learning_preferences from anon;
grant select,insert,update on public.review_cards,public.learning_preferences to authenticated;
grant select,insert on public.review_events to authenticated;
create function public.sync_learning(payload jsonb) returns void language plpgsql security invoker set search_path = '' as $$
declare item jsonb; owner uuid := auth.uid();
begin
 if owner is null then raise exception 'Authentication required'; end if;
 if jsonb_array_length(coalesce(payload->'cards','[]'::jsonb))>1000 or jsonb_array_length(coalesce(payload->'events','[]'::jsonb))>2000 then raise exception 'Batch too large'; end if;
 for item in select value from jsonb_array_elements(coalesce(payload->'cards','[]'::jsonb)) loop
  insert into public.review_cards(user_id,card_id,ease,interval_days,repetitions,due,last_reviewed,grade,reviews)
  values(owner,item->>'id',(item->>'ease')::numeric,(item->>'interval')::integer,(item->>'repetitions')::integer,(item->>'due')::timestamptz,(item->>'lastReviewed')::timestamptz,(item->>'grade')::integer,(item->>'reviews')::integer)
  on conflict(user_id,card_id) do update set ease=excluded.ease,interval_days=excluded.interval_days,repetitions=excluded.repetitions,due=excluded.due,last_reviewed=excluded.last_reviewed,grade=excluded.grade,reviews=excluded.reviews
  where public.review_cards.last_reviewed < excluded.last_reviewed;
 end loop;
 for item in select value from jsonb_array_elements(coalesce(payload->'events','[]'::jsonb)) loop
  insert into public.review_events(user_id,id,card_id,grade,reviewed_at)
  values(owner,(item->>'id')::uuid,item->>'cardId',(item->>'grade')::integer,(item->>'at')::timestamptz)
  on conflict(user_id,id) do nothing;
 end loop;

end;
$$;
revoke all on function public.sync_learning(jsonb) from public,anon;
grant execute on function public.sync_learning(jsonb) to authenticated;
commit;
