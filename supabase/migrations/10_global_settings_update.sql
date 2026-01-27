-- Add new columns to restaurant_settings for global configurations
ALTER TABLE restaurant_settings
ADD COLUMN IF NOT EXISTS max_pax_per_booking INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS min_advance_minutes INTEGER DEFAULT 60,
    ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
    ADD COLUMN IF NOT EXISTS contact_email TEXT,
    ADD COLUMN IF NOT EXISTS contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS social_instagram TEXT,
    ADD COLUMN IF NOT EXISTS social_facebook TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT;
-- Comment on columns
COMMENT ON COLUMN restaurant_settings.max_pax_per_booking IS 'Maximum number of people per single booking';
COMMENT ON COLUMN restaurant_settings.min_advance_minutes IS 'Minimum minutes in advance a booking can be made';
COMMENT ON COLUMN restaurant_settings.terms_and_conditions IS 'Text for Terms and Conditions of the service';