-- ORN-141 [ROJO]: bookings had fully-open RLS (default Supabase policies:
-- "Enable insert for everyone" / "Enable read access for all" / "Enable update
-- for all" with `true` quals, role public). Any anonymous user could read, edit
-- or delete any booking. This migration drops the open policies and installs
-- explicit per-role policies:
--   SELECT : customer owns its row (by email) OR staff/admin/manager
--   INSERT : public/anon allowed (booking flow is unauthenticated) but only
--            seeds `status = 'pending'`; status transitions happen server-side
--            under the staff policy, never by customers.
--   UPDATE : staff/admin/manager only
--   DELETE : admin/manager only
-- Safe to re-run: drops by name + creates if not exists.
--
-- Rollback: `down.sql` restores the original open policies (needed only if the
-- restricted set breaks the flow; re-applying the restricted set is preferred).

-- 1. Drop the default wide-open policies (idempotent).
drop policy if exists "Enable insert for everyone" on public.bookings;
drop policy if exists "Enable read access for all" on public.bookings;
drop policy if exists "Enable update for all" on public.bookings;
-- Belt & suspenders: any legacy-named open policies.
drop policy if exists "Customer view own bookings" on public.bookings;
drop policy if exists "Public/Anon create bookings" on public.bookings;
drop policy if exists "Admin update bookings" on public.bookings;
drop policy if exists "Admin delete bookings" on public.bookings;

-- 2. Restricted policies (mirror repo schema.sql intent).
-- SELECT: owner via email, or authenticated staff.
create policy "Customer view own bookings" on public.bookings
  for select using (
    customer_email = (auth.jwt() ->> 'email')
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager', 'staff')
    )
  );

-- INSERT: unauthenticated customers book without an account. Constrain the
-- row so an anon caller cannot forge a confirmed/seated/admin state; a new
-- booking always lands in `pending`.
create policy "Public/Anon create bookings" on public.bookings
  for insert with check (
    status = 'pending'
    and pax between 1 and 20
    and length(customer_email) <= 255
  );

-- UPDATE / DELETE: staff only (no public mutation).
create policy "Admin update bookings" on public.bookings
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager', 'staff')
    )
  );

create policy "Admin delete bookings" on public.bookings
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'manager')
    )
  );

-- 3. Revoke any default permissive grants on bookings from anon (defense in
--    depth: RLS is the gate, but anon should not hold blanket table-rights).
revoke all on public.bookings from anon;
revoke all on public.bookings from authenticated;
grant select, insert, update, delete on public.bookings to authenticated;
grant select, insert on public.bookings to anon;