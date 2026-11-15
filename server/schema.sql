-- Accounts and saved progress on Railway Postgres. Safe to run on every start.
create table if not exists users (
 id uuid primary key default gen_random_uuid(),
 email text,
 name text,
 created_at timestamptz not null default now()
);
create index if not exists users_email on users (lower(email));

-- One row per Apple or Google sign-in; several can point at the same learner.
create table if not exists identities (
 provider text not null check (provider in ('apple','google')),
 subject text not null,
 user_id uuid not null references users(id) on delete cascade,
 email text,
 created_at timestamptz not null default now(),
 primary key (provider, subject)
);
create index if not exists identities_user on identities (user_id);
create index if not exists identities_email on identities (lower(email));

-- Only a hash of each session token is stored.
create table if not exists sessions (
 token_hash text primary key,
 user_id uuid not null references users(id) on delete cascade,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null
);
create index if not exists sessions_user on sessions (user_id);

-- A Google sign-in in progress (state and nonce), and one-time codes for the iPhone app.
create table if not exists auth_requests (
 state text primary key,
 nonce text not null,
 mode text not null check (mode in ('web','app')),
 link_user uuid references users(id) on delete cascade,
 return_to text,
 created_at timestamptz not null default now()
);
create table if not exists auth_codes (
 code_hash text primary key,
 kind text not null check (kind in ('login','link')),
 user_id uuid not null references users(id) on delete cascade,
 created_at timestamptz not null default now()
);

create table if not exists review_cards (
 user_id uuid not null references users(id) on delete cascade,
 card_id text not null check (length(card_id) between 1 and 160),
 ease numeric not null check (ease between 1.3 and 10),
 interval_days integer not null check (interval_days between 1 and 36500),
 repetitions integer not null check (repetitions between 0 and 10000),
 due timestamptz not null,
 last_reviewed timestamptz not null,
 grade integer not null check (grade in (1,3,4,5)),
 reviews integer not null check (reviews between 1 and 100000),
 primary key (user_id, card_id)
);
create table if not exists review_events (
 user_id uuid not null references users(id) on delete cascade,
 id uuid not null,
 card_id text not null check (length(card_id) between 1 and 160),
 grade integer not null check (grade in (1,3,4,5)),
 reviewed_at timestamptz not null,
 primary key (user_id, id)
);
create index if not exists review_events_user_time on review_events (user_id, reviewed_at desc);
create table if not exists learning_preferences (
 user_id uuid primary key references users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object' and octet_length(data::text)<100000),
 updated_at timestamptz not null default now()
);
