
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text default 'free',
  stripe_customer_id text,
  created_at timestamptz default now()
);

create table if not exists items (
  id uuid primary key,
  user_id uuid references profiles(id) on delete cascade,
  source_url text,
  platform text,
  title text,
  author text,
  audio_path text,
  transcript text,
  summary text,
  key_points jsonb,
  categories text[],
  topics text[],
  language text,
  sentiment text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table items enable row level security;

create policy "Profiles select own" on profiles for select using (auth.uid() = id);
create policy "Profiles update own" on profiles for update using (auth.uid() = id);

create policy "Items select own" on items for select using (auth.uid() = user_id);
create policy "Items insert own" on items for insert with check (auth.uid() = user_id);
create policy "Items update own" on items for update using (auth.uid() = user_id);
create policy "Items delete own" on items for delete using (auth.uid() = user_id);

-- Storage bucket 'vaultly' privado (crear en el panel).
