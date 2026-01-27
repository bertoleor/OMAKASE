-- ============================================
-- MESS Reservations - Missing Tables Migration
-- ============================================
-- Run this SQL in the Supabase SQL Editor after the initial schema
-- Create payments table for tracking transactions
create table public.payments (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Foreign key to bookings
    booking_id uuid references public.bookings(id) on delete cascade,
    -- Payment data
    amount numeric not null,
    currency text not null default 'USD',
    status text not null default 'PENDING',
    -- PENDING, COMPLETED, FAILED, REFUNDED
    -- Idempotency for preventing duplicate charges
    idempotency_key text unique not null,
    -- Gateway data (optional)
    gateway_transaction_id text,
    gateway_response jsonb
);
-- Enable RLS
alter table public.payments enable row level security;
-- Policies (adjust based on your auth requirements)
create policy "Enable read access for authenticated users" on public.payments for
select using (auth.role() = 'authenticated');
create policy "Enable insert for authenticated users" on public.payments for
insert with check (auth.role() = 'authenticated');
-- ============================================
-- Payment logs table for debugging/auditing
-- ============================================
create table public.payment_logs (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    booking_id uuid,
    error_code text,
    payload jsonb
);
-- Enable RLS
alter table public.payment_logs enable row level security;
create policy "Enable read access for admin" on public.payment_logs for
select using (auth.role() = 'authenticated');
create policy "Enable insert for system" on public.payment_logs for
insert with check (true);
-- ============================================
-- Blocked dates table for admin management
-- ============================================
create table public.blocked_dates (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    date date unique not null,
    reason text,
    blocked_by uuid -- Could reference auth.users if you want
);
-- Enable RLS
alter table public.blocked_dates enable row level security;
create policy "Enable read access for all" on public.blocked_dates for
select using (true);
create policy "Enable write access for authenticated users" on public.blocked_dates for all using (auth.role() = 'authenticated');
-- ============================================
-- Indexes for performance
-- ============================================
create index idx_payments_booking_id on public.payments(booking_id);
create index idx_payments_idempotency_key on public.payments(idempotency_key);
create index idx_payment_logs_booking_id on public.payment_logs(booking_id);
create index idx_blocked_dates_date on public.blocked_dates(date);
-- ============================================
-- Enable Realtime (optional)
-- ============================================
alter publication supabase_realtime
add table public.payments;
alter publication supabase_realtime
add table public.blocked_dates;