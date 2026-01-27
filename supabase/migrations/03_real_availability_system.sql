-- ============================================
-- MESS Reservations - Real Availability System
-- ============================================
-- IDEMPOTENT: Safe to run multiple times
-- 1. Restaurant Settings Table
create table if not exists public.restaurant_settings (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    default_duration_minutes int not null default 120,
    gap_minutes int not null default 15,
    max_advance_days int default 30,
    opening_time text default '19:00',
    closing_time text default '23:00',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table public.restaurant_settings enable row level security;
drop policy if exists "Enable read access for all" on public.restaurant_settings;
create policy "Enable read access for all" on public.restaurant_settings for
select using (true);
drop policy if exists "Enable update for authenticated users" on public.restaurant_settings;
create policy "Enable update for authenticated users" on public.restaurant_settings for
update using (auth.role() = 'authenticated');
-- 2. Zones Table
create table if not exists public.zones (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    slug text unique not null,
    capacity_pax int not null,
    is_active boolean default true
);
-- Add display_order column if missing
alter table public.zones
add column if not exists display_order int default 0;
-- Enable RLS
alter table public.zones enable row level security;
drop policy if exists "Enable read access for all" on public.zones;
create policy "Enable read access for all" on public.zones for
select using (true);
drop policy if exists "Enable write access for authenticated users" on public.zones;
create policy "Enable write access for authenticated users" on public.zones for all using (auth.role() = 'authenticated');
-- 3. Update Bookings Table
alter table public.bookings
add column if not exists duration_minutes int default 120;
alter table public.bookings
add column if not exists zone_id uuid references public.zones(id);
-- Create index
create index if not exists idx_bookings_zone_time_status on public.bookings(zone_id, booking_date, booking_time, status);
-- 4. Seed Initial Data (only if empty)
insert into public.restaurant_settings (
        default_duration_minutes,
        gap_minutes,
        max_advance_days
    )
select 120,
    15,
    30
where not exists (
        select 1
        from public.restaurant_settings
    );
insert into public.zones (name, slug, capacity_pax, display_order)
select 'Interior - Salón Principal',
    'salon',
    23,
    1
where not exists (
        select 1
        from public.zones
        where slug = 'salon'
    );
insert into public.zones (name, slug, capacity_pax, display_order)
select 'Exterior - Pérgola',
    'pergola',
    15,
    2
where not exists (
        select 1
        from public.zones
        where slug = 'pergola'
    );
insert into public.zones (name, slug, capacity_pax, display_order)
select 'Interior - Barra',
    'barra',
    6,
    3
where not exists (
        select 1
        from public.zones
        where slug = 'barra'
    );