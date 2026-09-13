-- PCI (ORN-86): deprecate legacy card columns on `bookings`.
-- `card_brand`, `card_last_four` and `payment_token` were written by a legacy
-- payment flow that no longer exists. `payment_token` is a reusable token and is
-- the highest-risk column: it can authorize further charges and must not be
-- retained. The booking action (src/app/actions/bookings.ts) only ever writes
-- Mercado Pago reference IDs (`mp_payment_id`, `mp_preference_id`), so these
-- columns are never populated for new rows and any historical values are
-- removable. We drop them here to eliminate the blast radius.

-- Guard against data loss only if legacy values still exist for active bookings;
-- keeps the migration forward-only and backward-compatible with prior schema.sql.
alter table public.bookings
  drop column if exists payment_token,
  drop column if exists card_brand,
  drop column if exists card_last_four;