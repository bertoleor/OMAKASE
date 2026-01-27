-- ============================================
-- MESS Reservations - Blocked Dates Table
-- ============================================
-- IDEMPOTENT: Safe to run multiple times
create table if not exists public.blocked_dates (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    date date not null,
    reason text
);
-- Add zone_id column if missing
alter table public.blocked_dates
add column if not exists zone_id uuid references public.zones(id);
-- Add unique constraint (ignore if exists)
do $$ begin
alter table public.blocked_dates
add constraint blocked_dates_date_zone_unique unique(date, zone_id);
exception
when duplicate_object then null;
end $$;
-- Enable RLS
alter table public.blocked_dates enable row level security;
drop policy if exists "Enable read access for all" on public.blocked_dates;
create policy "Enable read access for all" on public.blocked_dates for
select using (true);
drop policy if exists "Enable write access for authenticated users" on public.blocked_dates;
create policy "Enable write access for authenticated users" on public.blocked_dates for all using (auth.role() = 'authenticated');
-- Index
create index if not exists idx_blocked_dates_date on public.blocked_dates(date);