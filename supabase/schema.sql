-- ============================================
-- MESS Reservations - Supabase Database Schema
-- ============================================
-- Run this SQL in the Supabase SQL Editor
-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";
-- Create ENUM types for data consistency
create type booking_status as enum (
    'pending',
    'confirmed',
    'seated',
    'completed',
    'cancelled',
    'no_show'
);
create type table_zone as enum ('indoor_tables', 'outdoor_pergola', 'indoor_bar');
-- Create bookings table
create table public.bookings (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Customer Data
    customer_name text not null,
    customer_email text not null,
    customer_phone text not null,
    -- Booking Data
    booking_date date not null,
    -- YYYY-MM-DD
    booking_time text not null,
    -- "20:30"
    pax int not null default 2,
    zone table_zone not null default 'indoor_tables',
    status booking_status not null default 'pending',
    -- Metadata
    notes text,
    deposit_amount numeric default 0
);
-- Enable Row Level Security (RLS)
alter table public.bookings enable row level security;
-- Policies (Permissive for demo)
-- 1. Anyone can create a booking (Client)
create policy "Enable insert for everyone" on public.bookings for
insert with check (true);
-- 2. Anyone can read bookings (Demo - in production, restrict to admins)
create policy "Enable read access for all" on public.bookings for
select using (true);
-- 3. Anyone can update bookings (Demo)
create policy "Enable update for all" on public.bookings for
update using (true);
-- Enable Realtime
alter publication supabase_realtime
add table public.bookings;
-- ============================================
-- OPTIONAL: Insert sample data for testing
-- ============================================
insert into public.bookings (
        customer_name,
        customer_email,
        customer_phone,
        booking_date,
        booking_time,
        pax,
        zone,
        status,
        notes
    )
values (
        'María del Carmen Fernández',
        'maria@email.com',
        '+34 612 345 678',
        current_date,
        '20:00',
        4,
        'indoor_tables',
        'confirmed',
        'Alergia a mariscos. Cumpleaños.'
    ),
    (
        'John Williams',
        'jwilliams@email.com',
        '+1 555 123 4567',
        current_date,
        '20:00',
        2,
        'indoor_bar',
        'seated',
        null
    ),
    (
        'Alejandro Rodríguez',
        'a.rodriguez@email.es',
        '+34 678 901 234',
        current_date,
        '20:15',
        6,
        'indoor_tables',
        'pending',
        'VIP - Periodista.'
    ),
    (
        'Yuki Tanaka',
        'yuki@email.jp',
        '+81 90 1234 5678',
        current_date,
        '20:30',
        3,
        'outdoor_pergola',
        'confirmed',
        'Vegetariano estricto.'
    ),
    (
        'Sophie Dupont',
        'sophie@email.fr',
        '+33 6 12 34 56 78',
        current_date,
        '21:15',
        2,
        'indoor_tables',
        'confirmed',
        'Aniversario de boda.'
    );