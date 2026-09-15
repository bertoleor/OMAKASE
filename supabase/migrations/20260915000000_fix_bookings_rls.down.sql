-- ORN-141 rollback: restore the original wide-open default Supabase policies.
-- Only apply this if the restricted RLS breaks the booking flow; re-applying
-- 20260915000000_fix_bookings_rls.sql is preferred over this rollback.

drop policy if exists "Customer view own bookings" on public.bookings;
drop policy if exists "Public/Anon create bookings" on public.bookings;
drop policy if exists "Admin update bookings" on public.bookings;
drop policy if exists "Admin delete bookings" on public.bookings;

create policy "Enable insert for everyone" on public.bookings
  for insert with check (true);

create policy "Enable read access for all" on public.bookings
  for select using (true);

create policy "Enable update for all" on public.bookings
  for update using (true);