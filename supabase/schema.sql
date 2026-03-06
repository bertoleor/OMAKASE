-- ============================================
-- MESS Reservations - Unified Database Schema
-- ============================================
-- Single source of truth for the database structure.
-- Includes: Tables, Types, RLS Policies, Functions, Indexes, and Seed Data.
-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
-- 2. ENUMS & TYPES
do $$ begin create type booking_status as enum (
    'pending',
    'confirmed',
    'seated',
    'completed',
    'cancelled',
    'no_show'
);
exception
when duplicate_object then null;
end $$;
do $$ begin create type table_zone as enum ('indoor_tables', 'outdoor_pergola', 'indoor_bar');
exception
when duplicate_object then null;
end $$;
-- 3. TABLES
-- Profiles (Linked to auth.users)
create table if not exists public.profiles (
    id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'staff' check (role in ('admin', 'manager', 'staff', 'cashier')),
    full_name text,
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    primary key (id)
);
-- Restaurant Settings
create table if not exists public.restaurant_settings (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    default_duration_minutes int not null default 120,
    gap_minutes int not null default 15,
    max_advance_days int default 30,
    opening_time text default '19:00',
    closing_time text default '23:00',
    max_pax_per_booking int default 10,
    min_advance_minutes int default 60,
    terms_and_conditions text,
    contact_email text,
    contact_phone text,
    social_instagram text,
    social_facebook text,
    address text
);
-- Zones
create table if not exists public.zones (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    slug text unique not null,
    capacity_pax int not null,
    is_active boolean default true,
    display_order int default 0
);
-- Tables (Physical tables)
create table if not exists public.tables (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()),
    zone_id uuid references public.zones(id) on delete cascade,
    name varchar(50) not null,
    seats int not null default 4,
    position_x numeric default 0,
    position_y numeric default 0,
    width numeric default 80,
    height numeric default 80,
    shape varchar(20) default 'square' check (shape in ('rectangle', 'circle', 'square')),
    rotation numeric default 0,
    is_active boolean default true,
    display_order int default 0
);
-- Bookings
create table if not exists public.bookings (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    customer_name text not null,
    customer_email text not null,
    customer_phone text not null,
    customer_dni text,
    booking_date date not null,
    booking_time text not null,
    pax int not null default 2,
    zone table_zone not null default 'indoor_tables',
    -- Legacy enum, prefer zone_id
    zone_id uuid references public.zones(id),
    table_id uuid references public.tables(id) on delete
    set null,
        status booking_status not null default 'pending',
        notes text,
        deposit_amount numeric default 0,
        duration_minutes int default 120,
        -- Reminders
        reminder_24h_sent timestamp with time zone,
        reminder_2h_sent timestamp with time zone,
        -- Payment / Card Info
        card_brand text,
        card_last_four text,
        payment_token text
);
-- Payments
create table if not exists public.payments (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    booking_id uuid references public.bookings(id) on delete cascade,
    amount numeric not null,
    currency text not null default 'USD',
    status text not null default 'PENDING',
    idempotency_key text unique not null,
    gateway_transaction_id text,
    gateway_response jsonb
);
-- Payment Logs
create table if not exists public.payment_logs (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    booking_id uuid,
    error_code text,
    payload jsonb
);
-- Blocked Dates
create table if not exists public.blocked_dates (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    date date not null,
    reason text,
    blocked_by uuid,
    zone_id uuid references public.zones(id)
);
-- Unique constraint for blocked dates
do $$ begin
alter table public.blocked_dates
add constraint blocked_dates_date_zone_unique unique(date, zone_id);
exception
when duplicate_object then null;
end $$;
-- Agent Audit Logs
create table if not exists public.agent_audit_logs (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    trace_id uuid not null,
    skill_name text not null,
    input_data jsonb not null,
    output_result text not null,
    error_details jsonb,
    execution_time_ms int
);
-- Weekly Schedule
create table if not exists public.weekly_schedule (
    id uuid primary key default uuid_generate_v4(),
    day_of_week int not null unique check (
        day_of_week between 0 and 6
    ),
    is_open boolean default true,
    opening_time time default '12:00',
    closing_time time default '23:00',
    deposit_amount numeric default 0,
    notes varchar(255),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
-- Events
create table if not exists public.events (
    id uuid primary key default uuid_generate_v4(),
    name varchar(100) not null,
    description text,
    event_type varchar(50) default 'restaurant',
    event_date date not null,
    start_time time not null,
    end_time time not null,
    max_capacity int,
    current_guests int default 0,
    price_per_person numeric default 0,
    deposit_required numeric default 0,
    zones_enabled uuid [],
    blocks_regular_bookings boolean default true,
    contact_name varchar(100),
    contact_phone varchar(50),
    contact_email varchar(100),
    status varchar(20) default 'scheduled' check (
        status in ('scheduled', 'active', 'completed', 'cancelled')
    ),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
-- Event History
create table if not exists public.event_history (
    id uuid primary key default uuid_generate_v4(),
    event_id uuid references public.events(id) on delete
    set null,
        event_name varchar(100),
        event_date date,
        event_type varchar(50),
        guests_attended int,
        revenue numeric,
        notes text,
        archived_at timestamp with time zone default now()
);
-- 4. INDEXES
create index if not exists idx_bookings_zone_time_status on public.bookings(zone_id, booking_date, booking_time, status);
create index if not exists idx_bookings_reminders on public.bookings(booking_date, status)
where reminder_24h_sent is null
    or reminder_2h_sent is null;
create index if not exists idx_bookings_table_id on public.bookings(table_id);
create index if not exists idx_tables_zone_id on public.tables(zone_id);
create index if not exists idx_payments_booking_id on public.payments(booking_id);
create index if not exists idx_payments_idempotency_key on public.payments(idempotency_key);
create index if not exists idx_blocked_dates_date on public.blocked_dates(date);
create index if not exists idx_events_date on public.events(event_date);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_agent_audit_logs_created_at on public.agent_audit_logs(created_at desc);
create index if not exists idx_agent_audit_logs_trace_id on public.agent_audit_logs(trace_id);
-- 5. FUNCTIONS & TRIGGERS
-- Handle New User (Profile Creation)
create or replace function public.handle_new_user() returns trigger as $$ begin
insert into public.profiles (id, full_name, role)
values (
        new.id,
        new.raw_user_meta_data->>'full_name',
        'staff'
    );
return new;
end;
$$ language plpgsql security definer;
-- Dashboard Stats
create or replace function get_dashboard_stats() returns jsonb language plpgsql security definer as $$
declare result jsonb;
today_date date := current_date;
begin
select jsonb_build_object(
        'today',
        (
            select jsonb_build_object(
                    'total_bookings',
                    count(*),
                    'confirmed',
                    count(*) filter (
                        where status = 'confirmed'
                    ),
                    'pending',
                    count(*) filter (
                        where status = 'pending'
                    ),
                    'seated',
                    count(*) filter (
                        where status = 'seated'
                    ),
                    'cancelled',
                    count(*) filter (
                        where status = 'cancelled'
                    ),
                    'total_pax',
                    coalesce(sum(pax), 0),
                    'revenue_potential',
                    coalesce(sum(deposit_amount), 0)
                )
            from bookings
            where booking_date = today_date
        ),
        'upcoming',
        jsonb_build_object(
            'next_7_days',
            (
                select count(*)
                from bookings
                where booking_date between today_date and today_date + interval '7 days'
                    and status in ('confirmed', 'pending')
            ),
            'next_30_days',
            (
                select count(*)
                from bookings
                where booking_date between today_date and today_date + interval '30 days'
                    and status in ('confirmed', 'pending')
            )
        ),
        'zones',
        coalesce(
            (
                select jsonb_agg(
                        zone_stats
                        order by zone_stats->>'display_order'
                    )
                from (
                        select jsonb_build_object(
                                'zone_name',
                                z.name,
                                'current_occupancy',
                                coalesce(
                                    (
                                        select sum(pax)
                                        from bookings b
                                        where b.zone_id = z.id
                                            and b.booking_date = today_date
                                            and b.status = 'seated'
                                    ),
                                    0
                                ),
                                'capacity',
                                z.capacity_pax,
                                'utilization_percent',
                                round(
                                    (
                                        coalesce(
                                            (
                                                select sum(pax)
                                                from bookings b
                                                where b.zone_id = z.id
                                                    and b.booking_date = today_date
                                                    and b.status = 'seated'
                                            ),
                                            0
                                        )::numeric / nullif(z.capacity_pax, 0)
                                    ) * 100
                                ),
                                'display_order',
                                z.display_order
                            ) as zone_stats
                        from zones z
                        where z.is_active = true
                    ) as zone_data
            ),
            '[]'::jsonb
        )
    ) into result;
return result;
end;
$$;
-- Archive Event
create or replace function archive_completed_event(
        p_event_id uuid,
        p_guests int,
        p_revenue numeric,
        p_notes text
    ) returns void as $$ begin
insert into event_history (
        event_id,
        event_name,
        event_date,
        event_type,
        guests_attended,
        revenue,
        notes
    )
select id,
    name,
    event_date,
    event_type,
    p_guests,
    p_revenue,
    p_notes
from events
where id = p_event_id;
update events
set status = 'completed',
    updated_at = now()
where id = p_event_id;
end;
$$ language plpgsql;
-- Triggers
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after
insert on auth.users for each row execute procedure public.handle_new_user();
-- 6. RLS POLICIES
alter table public.profiles enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.zones enable row level security;
alter table public.tables enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.agent_audit_logs enable row level security;
alter table public.weekly_schedule enable row level security;
alter table public.events enable row level security;
alter table public.event_history enable row level security;
-- Clean existing policies (safe execution)
do $$ begin execute (
    select string_agg(
            'drop policy if exists "' || policyname || '" on ' || tablename || ';',
            ''
        )
    from pg_policies
    where schemaname = 'public'
);
exception
when others then null;
end $$;
-- Profiles
create policy "Users can view own profile" on public.profiles for
select using (auth.uid() = id);
create policy "Admins view all profiles" on public.profiles for
select using (
        auth.uid() in (
            select id
            from public.profiles
            where role in ('admin', 'manager')
        )
    );
-- Settings & Zones & Weekly Schedule (Admin/Manager Write, Public Read)
create policy "Public read settings" on public.restaurant_settings for
select using (true);
create policy "Admin update settings" on public.restaurant_settings for
update using (
        auth.uid() in (
            select id
            from public.profiles
            where role in ('admin', 'manager')
        )
    );
create policy "Public read zones" on public.zones for
select using (true);
create policy "Admin manage zones" on public.zones for all using (
    auth.uid() in (
        select id
        from public.profiles
        where role in ('admin', 'manager')
    )
);
create policy "Public read weekly_schedule" on public.weekly_schedule for
select using (true);
create policy "Admin manage weekly_schedule" on public.weekly_schedule for all using (
    auth.uid() in (
        select id
        from public.profiles
        where role in ('admin', 'manager')
    )
);
-- Tables (Admin manage, Auth read)
create policy "Auth read tables" on public.tables for
select to authenticated using (true);
create policy "Admin manage tables" on public.tables for all to authenticated using (
    auth.uid() in (
        select id
        from public.profiles
        where role in ('admin', 'manager')
    )
);
-- Bookings (Customer Own, Admin Full)
create policy "Customer view own bookings" on public.bookings for
select using (
        customer_email = (auth.jwt()->>'email')
        OR auth.uid() in (
            select id
            from public.profiles
            where role in ('admin', 'manager', 'staff')
        )
    );
create policy "Public/Anon create bookings" on public.bookings for
insert with check (true);
create policy "Admin update bookings" on public.bookings for
update using (
        auth.uid() in (
            select id
            from public.profiles
            where role in ('admin', 'manager', 'staff')
        )
    );
create policy "Admin delete bookings" on public.bookings for delete using (
    auth.uid() in (
        select id
        from public.profiles
        where role in ('admin', 'manager')
    )
);
-- Payments (Admin/Staff/Owner view)
create policy "View payments" on public.payments for
select using (
        auth.uid() in (
            select id
            from public.profiles
            where role in ('admin', 'manager', 'staff')
        )
        OR exists (
            select 1
            from public.bookings b
            where b.id = booking_id
                and b.customer_email = (auth.jwt()->>'email')
        )
    );
create policy "Insert payments" on public.payments for
insert with check (true);
-- Blocked Dates, Events (Public Read, Admin Write)
create policy "Public read blocked_dates" on public.blocked_dates for
select using (true);
create policy "Admin manage blocked_dates" on public.blocked_dates for all using (
    auth.uid() in (
        select id
        from public.profiles
        where role in ('admin', 'manager')
    )
);
create policy "Auth read events" on public.events for
select to authenticated using (true);
create policy "Admin manage events" on public.events for all using (
    auth.uid() in (
        select id
        from public.profiles
        where role in ('admin', 'manager')
    )
);
-- 7. REALTIME
alter publication supabase_realtime
add table public.bookings,
    public.payments,
    public.blocked_dates,
    public.agent_audit_logs;
-- 8. SEED DATA (Idempotent)
insert into public.restaurant_settings (
        default_duration_minutes,
        gap_minutes,
        max_advance_days,
        opening_time,
        closing_time
    )
select 120,
    15,
    30,
    '19:00',
    '23:00'
where not exists (
        select 1
        from public.restaurant_settings
    );
insert into public.zones (name, slug, capacity_pax, display_order)
values ('Interior - Salón Principal', 'salon', 23, 1),
    ('Exterior - Pérgola', 'pergola', 15, 2),
    ('Interior - Barra', 'barra', 6, 3) on conflict (slug) do nothing;
insert into public.weekly_schedule (day_of_week, is_open, opening_time, closing_time)
values (0, false, '12:00', '23:00'),
    -- Sunday
    (1, false, '12:00', '23:00'),
    -- Monday
    (2, true, '19:00', '23:30'),
    (3, true, '19:00', '23:30'),
    (4, true, '19:00', '23:30'),
    (5, true, '19:00', '00:00'),
    (6, true, '19:00', '00:00') on conflict (day_of_week) do nothing;
-- Example Tables (only if empty)
-- (Skipping full table insert for brevity unless specific request, but ensuring logical tables exist)
-- See 08_tables_and_assignment.sql for detailed table coordinates if needed.

-- =============================================================================
-- 7. REALTIME WEBHOOK TRIGGERS
-- =============================================================================
-- These triggers enable Supabase Realtime and notify external services
-- about database changes for webhook integration

-- Enable realtime for bookings table
alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table tables;
alter publication supabase_realtime add table zones;
alter publication supabase_realtime add table events;

-- Function to notify on booking changes
create or replace function notify_booking_change() returns trigger as $
begin
  -- This triggers Supabase Realtime automatically
  -- The webhook endpoint can process these events
  if TG_OP = 'INSERT' then
    perform pg_notify('booking_changes', json_build_object(
      'type', 'INSERT',
      'table', 'bookings',
      'record', row_to_json(NEW),
      'timestamp', now()::text
    )::text);
    return NEW;
  elsif TG_OP = 'UPDATE' then
    perform pg_notify('booking_changes', json_build_object(
      'type', 'UPDATE',
      'table', 'bookings',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD),
      'timestamp', now()::text
    )::text);
    return NEW;
  elsif TG_OP = 'DELETE' then
    perform pg_notify('booking_changes', json_build_object(
      'type', 'DELETE',
      'table', 'bookings',
      'old_record', row_to_json(OLD),
      'timestamp', now()::text
    )::text);
    return OLD;
  end if;
  return null;
end;
$ language plpgsql security definer;

-- Function to notify on table changes
create or replace function notify_table_change() returns trigger as $
begin
  if TG_OP = 'INSERT' then
    perform pg_notify('table_changes', json_build_object(
      'type', 'INSERT',
      'table', 'tables',
      'record', row_to_json(NEW),
      'timestamp', now()::text
    )::text);
    return NEW;
  elsif TG_OP = 'UPDATE' then
    perform pg_notify('table_changes', json_build_object(
      'type', 'UPDATE',
      'table', 'tables',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD),
      'timestamp', now()::text
    )::text);
    return NEW;
  elsif TG_OP = 'DELETE' then
    perform pg_notify('table_changes', json_build_object(
      'type', 'DELETE',
      'table', 'tables',
      'old_record', row_to_json(OLD),
      'timestamp', now()::text
    )::text);
    return OLD;
  end if;
  return null;
end;
$ language plpgsql security definer;

-- Function to notify on zone changes
create or replace function notify_zone_change() returns trigger as $
begin
  if TG_OP = 'INSERT' then
    perform pg_notify('zone_changes', json_build_object(
      'type', 'INSERT',
      'table', 'zones',
      'record', row_to_json(NEW),
      'timestamp', now()::text
    )::text);
    return NEW;
  elsif TG_OP = 'UPDATE' then
    perform pg_notify('zone_changes', json_build_object(
      'type', 'UPDATE',
      'table', 'zones',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD),
      'timestamp', now()::text
    )::text);
    return NEW;
  elsif TG_OP = 'DELETE' then
    perform pg_notify('zone_changes', json_build_object(
      'type', 'DELETE',
      'table', 'zones',
      'old_record', row_to_json(OLD),
      'timestamp', now()::text
    )::text);
    return OLD;
  end if;
  return null;
end;
$ language plpgsql security definer;

-- Create triggers for bookings
drop trigger if exists on_booking_insert on bookings;
create trigger on_booking_insert
after insert on bookings for each row execute procedure notify_booking_change();

drop trigger if exists on_booking_update on bookings;
create trigger on_booking_update
after update on bookings for each row execute procedure notify_booking_change();

drop trigger if exists on_booking_delete on bookings;
create trigger on_booking_delete
after delete on bookings for each row execute procedure notify_booking_change();

-- Create triggers for tables
drop trigger if exists on_table_insert on tables;
create trigger on_table_insert
after insert on tables for each row execute procedure notify_table_change();

drop trigger if exists on_table_update on tables;
create trigger on_table_update
after update on tables for each row execute procedure notify_table_change();

drop trigger if exists on_table_delete on tables;
create trigger on_table_delete
after delete on tables for each row execute procedure notify_table_change();

-- Create triggers for zones
drop trigger if exists on_zone_insert on zones;
create trigger on_zone_insert
after insert on zones for each row execute procedure notify_zone_change();

drop trigger if exists on_zone_update on zones;
create trigger on_zone_update
after update on zones for each row execute procedure notify_zone_change();

drop trigger if exists on_zone_delete on zones;
create trigger on_zone_delete
after delete on zones for each row execute procedure notify_zone_change();