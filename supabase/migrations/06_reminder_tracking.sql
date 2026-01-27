-- ============================================
-- MESS Reservations - Reminder tracking columns
-- ============================================
-- Add columns to track when reminders were sent
alter table public.bookings
add column if not exists reminder_24h_sent timestamp with time zone;
alter table public.bookings
add column if not exists reminder_2h_sent timestamp with time zone;
-- Index for reminder queries
create index if not exists idx_bookings_reminders on public.bookings(booking_date, status)
where reminder_24h_sent is null
    or reminder_2h_sent is null;