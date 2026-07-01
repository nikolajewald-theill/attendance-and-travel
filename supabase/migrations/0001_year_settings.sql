-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Additive only: adds a column and a new table, migrates existing 2026 data. Nothing is dropped.

alter table user_settings add column if not exists last_year integer;

create table if not exists year_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  vacation_allowance integer not null default 25,
  date_range_start date not null,
  date_range_end date not null,
  primary key (user_id, year)
);

alter table year_settings enable row level security;

create policy "select own year settings" on year_settings
  for select using (auth.uid() = user_id);
create policy "insert own year settings" on year_settings
  for insert with check (auth.uid() = user_id);
create policy "update own year settings" on year_settings
  for update using (auth.uid() = user_id);
create policy "delete own year settings" on year_settings
  for delete using (auth.uid() = user_id);

-- One-time migration of existing settings into year_settings for 2026.
insert into year_settings (user_id, year, vacation_allowance, date_range_start, date_range_end)
select user_id, 2026, vacation_allowance, date_range_start, date_range_end
from user_settings
on conflict (user_id, year) do nothing;

update user_settings set last_year = 2026 where last_year is null;
