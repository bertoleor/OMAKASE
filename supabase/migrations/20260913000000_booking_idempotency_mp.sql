-- P0: createBooking idempotency + Mercado Pago reference IDs (PCI: no PAN data).
alter table public.bookings
  add column if not exists idempotency_key text,
  add column if not exists mp_payment_id text,
  add column if not exists mp_preference_id text;

-- Partial unique index: safe retries with the same key return the original row.
create unique index if not exists idx_bookings_idempotency_key
  on public.bookings(idempotency_key)
  where idempotency_key is not null;
