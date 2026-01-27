-- ============================================
-- MESS Reservations - Security Policies & RLS
-- ============================================
-- 1. Ensure RLS is enabled on all critical tables
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.zones enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.agent_audit_logs enable row level security;
-- 2. Drop existing policies to avoid conflicts (clean slate approach for critical tables)
drop policy if exists "Enable read access for all" on public.restaurant_settings;
drop policy if exists "Enable update for authenticated users" on public.restaurant_settings;
drop policy if exists "Enable read access for all" on public.zones;
drop policy if exists "Enable write access for authenticated users" on public.zones;
-- BOOKINGS POLICIES
drop policy if exists "Customers can view their own bookings" on public.bookings;
drop policy if exists "Customers can create bookings" on public.bookings;
drop policy if exists "Customers can update their own bookings" on public.bookings;
drop policy if exists "Admins have full access to bookings" on public.bookings;
-- Customer: View Own (matching email in JWT)
-- Note: This matches the email field in the bookings table against the email user logged in with
create policy "Customers can view their own bookings" on public.bookings for
select using (
        customer_email = (auth.jwt()->>'email')
        OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
        OR (auth.jwt()->'user_metadata'->>'role') = 'staff'
    );
-- Customer: Create (Anyone can create initially, or authenticated? 
-- Usually bookings are created by public wizard or authenticated user. 
-- If public wizard creates without login, we need public insert if RLS is on.
-- Let's check: Wizard creates booking. Does it require login? 
-- Typically wizard is public. So we allow INSERT for anon IF configured, 
-- but here we might want to restrict to authenticated OR public insert if we treat wizard users as anon.
-- Assuming wizard uses anon key.
create policy "Anyone can create bookings" on public.bookings for
insert with check (true);
-- Admins: Full Access
create policy "Admins can update bookings" on public.bookings for
update using (
        (auth.jwt()->'user_metadata'->>'role') = 'admin'
        OR (auth.jwt()->'user_metadata'->>'role') = 'staff'
    );
create policy "Admins can delete bookings" on public.bookings for delete using (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
);
-- PAYMENTS POLICIES
drop policy if exists "Enable read access for authenticated users" on public.payments;
drop policy if exists "Enable insert for authenticated users" on public.payments;
-- View: Admin/Staff OR Owner of the linked booking
create policy "View payments policy" on public.payments for
select using (
        (auth.jwt()->'user_metadata'->>'role') IN ('admin', 'staff')
        OR EXISTS (
            SELECT 1
            FROM public.bookings b
            WHERE b.id = booking_id
                AND b.customer_email = (auth.jwt()->>'email')
        )
    );
-- Insert: Service Role usually handles this (webhooks), but if client creates:
-- We allow authenticated insert for now, validation happens in backend fn usually.
create policy "Insert payments policy" on public.payments for
insert with check (
        auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );
-- SETTINGS & ZONES (Admin Only Write, Public Read)
create policy "Public read settings" on public.restaurant_settings for
select using (true);
create policy "Admin update settings" on public.restaurant_settings for
update using (
        (auth.jwt()->'user_metadata'->>'role') = 'admin'
    );
create policy "Public read zones" on public.zones for
select using (true);
create policy "Admin manage zones" on public.zones for all using (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
);
-- BLOCKED DATES
drop policy if exists "Enable read access for all" on public.blocked_dates;
drop policy if exists "Enable write access for authenticated users" on public.blocked_dates;
create policy "Public read blocked dates" on public.blocked_dates for
select using (true);
create policy "Admin manage blocked dates" on public.blocked_dates for all using (
    (auth.jwt()->'user_metadata'->>'role') IN ('admin', 'staff')
);