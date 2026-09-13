-- =============================================================================
-- MESS Reservations - Zero-Base Master Setup Script
-- =============================================================================
-- This script performs a destructive wipe and complete reconstruction 
-- of the database schema to ensure 100% alignment with project requirements.
-- =============================================================================

-- 0. DESTRUCTIVE WIPE
-- WARNING: This will delete everything in the public schema!
drop schema if exists public cascade;
create schema public;

-- Restore default permissions
grant all on schema public to postgres;
grant all on schema public to public;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. ENUMS & TYPES
create type public.booking_status as enum (
    'pending',
    'confirmed',
    'seated',
    'completed',
    'cancelled',
    'no_show'
);

create type public.table_zone as enum (
    'indoor_tables', 
    'outdoor_pergola', 
    'indoor_bar'
);

-- 3. TABLES

-- Profiles (Linked to auth.users)
create table public.profiles (
    id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'staff' check (role in ('admin', 'manager', 'staff', 'cashier')),
    full_name text,
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    primary key (id)
);

-- Restaurant Settings
create table public.restaurant_settings (
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
create table public.zones (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    slug text unique not null,
    capacity_pax int not null,
    is_active boolean default true,
    display_order int default 0
);

-- Tables (Physical tables)
create table public.tables (
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
create table public.bookings (
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
    zone_id uuid references public.zones(id),
    table_id uuid references public.tables(id) on delete set null,
    status booking_status not null default 'pending',
    notes text,
    deposit_amount numeric default 0,
    duration_minutes int default 120,
    -- Reminders
    reminder_24h_sent timestamp with time zone,
    reminder_2h_sent timestamp with time zone,
    -- Payment / Card Info
        -- PCI (ORN-86): no card data is persisted. Only Mercado Pago reference IDs
        -- are stored (see below); legacy `card_brand` / `card_last_four` /
        -- `payment_token` columns have been dropped via
        -- 20260913000100_drop_legacy_card_columns.sql.
        -- Idempotency + Mercado Pago references (only IDs, never PAN data)
    idempotency_key text,
    mp_payment_id text,
    mp_preference_id text
);

-- Payments
create table public.payments (
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
create table public.payment_logs (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    booking_id uuid,
    error_code text,
    payload jsonb
);

-- Blocked Dates
create table public.blocked_dates (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    date date not null,
    reason text,
    blocked_by uuid,
    zone_id uuid references public.zones(id),
    constraint blocked_dates_date_zone_unique unique(date, zone_id)
);

-- Agent Audit Logs
create table public.agent_audit_logs (
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
create table public.weekly_schedule (
    id uuid primary key default uuid_generate_v4(),
    day_of_week int not null unique check (day_of_week between 0 and 6),
    is_open boolean default true,
    opening_time time default '12:00',
    closing_time time default '23:00',
    deposit_amount numeric default 0,
    notes varchar(255),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Events
create table public.events (
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
    zones_enabled uuid[],
    blocks_regular_bookings boolean default true,
    contact_name varchar(100),
    contact_phone varchar(50),
    contact_email varchar(100),
    status varchar(20) default 'scheduled' check (status in ('scheduled', 'active', 'completed', 'cancelled')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Event History
create table public.event_history (
    id uuid primary key default uuid_generate_v4(),
    event_id uuid references public.events(id) on delete set null,
    event_name varchar(100),
    event_date date,
    event_type varchar(50),
    guests_attended int,
    revenue numeric,
    notes text,
    archived_at timestamp with time zone default now()
);

-- 4. INDEXES
create index idx_bookings_zone_time_status on public.bookings(zone_id, booking_date, booking_time, status);
create index idx_bookings_reminders on public.bookings(booking_date, status) where reminder_24h_sent is null or reminder_2h_sent is null;
create index idx_bookings_table_id on public.bookings(table_id);
create index idx_tables_zone_id on public.tables(zone_id);
create index idx_payments_booking_id on public.payments(booking_id);
create index idx_payments_idempotency_key on public.payments(idempotency_key);
create index idx_blocked_dates_date on public.blocked_dates(date);
create index idx_events_date on public.events(event_date);
create index idx_events_status on public.events(status);
create index idx_agent_audit_logs_created_at on public.agent_audit_logs(created_at desc);
create index idx_agent_audit_logs_trace_id on public.agent_audit_logs(trace_id);

-- 5. FUNCTIONS & TRIGGERS

-- Handle New User (Profile Creation)
create or replace function public.handle_new_user() 
returns trigger as $$ 
begin
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
create or replace function public.get_dashboard_stats() 
returns jsonb 
language plpgsql 
security definer 
as $$
declare 
    result jsonb;
    today_date date := current_date;
begin
    select jsonb_build_object(
        'today',
        (
            select jsonb_build_object(
                'total_bookings', count(*),
                'confirmed', count(*) filter (where status = 'confirmed'),
                'pending', count(*) filter (where status = 'pending'),
                'seated', count(*) filter (where status = 'seated'),
                'cancelled', count(*) filter (where status = 'cancelled'),
                'total_pax', coalesce(sum(pax), 0),
                'revenue_potential', coalesce(sum(deposit_amount), 0)
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
                select jsonb_agg(zone_stats order by zone_stats->>'display_order')
                from (
                    select jsonb_build_object(
                        'zone_name', z.name,
                        'current_occupancy', coalesce((
                            select sum(pax)
                            from bookings b
                            where b.zone_id = z.id
                            and b.booking_date = today_date
                            and b.status = 'seated'
                        ), 0),
                        'capacity', z.capacity_pax,
                        'utilization_percent', round((
                            coalesce((
                                select sum(pax)
                                from bookings b
                                where b.zone_id = z.id
                                and b.booking_date = today_date
                                and b.status = 'seated'
                            ), 0)::numeric / nullif(z.capacity_pax, 0)
                        ) * 100),
                        'display_order', z.display_order
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
create or replace function public.archive_completed_event(
    p_event_id uuid,
    p_guests int,
    p_revenue numeric,
    p_notes text
) returns void as $$ 
begin
    insert into event_history (
        event_id, event_name, event_date, event_type, guests_attended, revenue, notes
    )
    select id, name, event_date, event_type, p_guests, p_revenue, p_notes
    from events
    where id = p_event_id;
    
    update events
    set status = 'completed', updated_at = now()
    where id = p_event_id;
end;
$$ language plpgsql;

-- Notification Function (Realtime Webhooks)
create or replace function public.notify_table_change() 
returns trigger as $$
begin
  perform pg_notify(
    lower(TG_TABLE_NAME) || '_changes', 
    json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', case when TG_OP = 'DELETE' then row_to_json(OLD) else row_to_json(NEW) end,
      'timestamp', now()::text
    )::text
  );
  return null;
end;
$$ language plpgsql security definer;

-- Triggers
create trigger on_auth_user_created
after insert on auth.users for each row execute procedure public.handle_new_user();

-- Generic Change Triggers for Realtime
create trigger on_booking_change after insert or update or delete on bookings for each row execute procedure notify_table_change();
create trigger on_table_change after insert or update or delete on tables for each row execute procedure notify_table_change();
create trigger on_zone_change after insert or update or delete on zones for each row execute procedure notify_table_change();

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

-- Profiles Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins view all profiles" on public.profiles for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
);

-- Settings & Zones & Weekly Schedule (Admin/Manager Write, Public Read)
create policy "Public read settings" on public.restaurant_settings for select using (true);
create policy "Admin update settings" on public.restaurant_settings for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
);

create policy "Public read zones" on public.zones for select using (true);
create policy "Admin manage zones" on public.zones for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
);

create policy "Public read weekly_schedule" on public.weekly_schedule for select using (true);
create policy "Admin manage weekly_schedule" on public.weekly_schedule for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
);

-- Tables (Admin manage, Auth read)
create policy "Auth read tables" on public.tables for select to authenticated using (true);
create policy "Admin manage tables" on public.tables for all to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
);

-- Bookings (Customer Own, Admin Full)
create policy "Customer view own bookings" on public.bookings for select using (
    customer_email = (auth.jwt()->>'email')
    OR exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'staff'))
);
create policy "Public/Anon create bookings" on public.bookings for insert with check (true);
create policy "Admin update bookings" on public.bookings for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'staff'))
);
create policy "Admin delete bookings" on public.bookings for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
);

-- Payments (Admin/Staff/Owner view)
create policy "View payments" on public.payments for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager', 'staff'))
    OR exists (
        select 1 from public.bookings b 
        where b.id = booking_id and b.customer_email = (auth.jwt()->>'email')
    )
);
create policy "Insert payments" on public.payments for insert with check (true);

-- Blocked Dates, Events (Public Read, Admin Write)
create policy "Public read blocked_dates" on public.blocked_dates for select using (true);
create policy "Admin manage blocked_dates" on public.blocked_dates for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
);

create policy "Auth read events" on public.events for select to authenticated using (true);
create policy "Admin manage events" on public.events for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'manager'))
);

-- 7. REALTIME
-- Drop publication if exists then create
drop publication if exists supabase_realtime;
create publication supabase_realtime for table 
    public.bookings, 
    public.payments, 
    public.blocked_dates, 
    public.agent_audit_logs,
    public.tables,
    public.zones,
    public.events;

-- 8. SEED DATA

insert into public.restaurant_settings (
    default_duration_minutes, gap_minutes, max_advance_days, opening_time, closing_time
) values (120, 15, 30, '19:00', '23:00');

insert into public.zones (name, slug, capacity_pax, display_order)
values 
    ('Interior - Salón Principal', 'salon', 23, 1),
    ('Exterior - Pérgola', 'pergola', 15, 2),
    ('Interior - Barra', 'barra', 6, 3);

insert into public.weekly_schedule (day_of_week, is_open, opening_time, closing_time)
values 
    (0, false, '12:00', '23:00'), -- Sunday
    (1, false, '12:00', '23:00'), -- Monday
    (2, true, '19:00', '23:30'),
    (3, true, '19:00', '23:30'),
    (4, true, '19:00', '23:30'),
    (5, true, '19:00', '00:00'),
    (6, true, '19:00', '00:00');