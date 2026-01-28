-- Add missing payment columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS card_brand text,
    ADD COLUMN IF NOT EXISTS card_last_four text,
    ADD COLUMN IF NOT EXISTS payment_token text,
    ADD COLUMN IF NOT EXISTS customer_dni text;
-- Add comments for documentation
COMMENT ON COLUMN public.bookings.card_brand IS 'Brand of the credit card used for guarantee (e.g., visa, mastercard)';
COMMENT ON COLUMN public.bookings.card_last_four IS 'Last 4 digits of the credit card';
COMMENT ON COLUMN public.bookings.payment_token IS 'Token returned by payment processor (mock for now)';
COMMENT ON COLUMN public.bookings.customer_dni IS 'DNI/ID of the customer for billing/guarantee purposes';