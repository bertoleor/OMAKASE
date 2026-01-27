-- Migration: Weekly Schedule, Events, and Day Pricing
-- Purpose: Complete admin configuration system
-- =============================================
-- 1. WEEKLY SCHEDULE (Horarios por día de semana)
-- =============================================
CREATE TABLE IF NOT EXISTS weekly_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (
        day_of_week BETWEEN 0 AND 6
    ),
    -- 0=Sunday, 6=Saturday
    is_open BOOLEAN DEFAULT true,
    opening_time TIME DEFAULT '12:00',
    closing_time TIME DEFAULT '23:00',
    -- Pricing
    deposit_amount NUMERIC DEFAULT 0,
    notes VARCHAR(255),
    -- e.g., "Sushi Libre - Sin reservas"
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(day_of_week)
);
-- Insert default schedule (all days open)
INSERT INTO weekly_schedule (
        day_of_week,
        is_open,
        opening_time,
        closing_time,
        deposit_amount,
        notes
    )
VALUES (0, false, '12:00', '23:00', 0, 'Domingo cerrado'),
    -- Sunday
    (
        1,
        false,
        '12:00',
        '23:00',
        0,
        'Lunes cerrado (franco)'
    ),
    -- Monday
    (2, true, '19:00', '23:30', 20, NULL),
    -- Tuesday
    (3, true, '19:00', '23:30', 20, NULL),
    -- Wednesday
    (4, true, '19:00', '23:30', 30, NULL),
    -- Thursday
    (5, true, '19:00', '00:00', 50, NULL),
    -- Friday
    (6, true, '19:00', '00:00', 50, NULL) -- Saturday
    ON CONFLICT (day_of_week) DO NOTHING;
-- =============================================
-- 2. EVENTS (Eventos especiales)
-- =============================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Event Info
    name VARCHAR(100) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'restaurant',
    -- 'restaurant', 'private', 'rental'
    -- Date/Time
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    -- Capacity
    max_capacity INTEGER,
    current_guests INTEGER DEFAULT 0,
    -- Pricing
    price_per_person NUMERIC DEFAULT 0,
    deposit_required NUMERIC DEFAULT 0,
    -- Zones
    zones_enabled UUID [],
    -- Array of zone IDs enabled for this event
    blocks_regular_bookings BOOLEAN DEFAULT true,
    -- Contact (for private events)
    contact_name VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'active', 'completed', 'cancelled')
    ),
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- 3. EVENT HISTORY (Historial de eventos)
-- =============================================
CREATE TABLE IF NOT EXISTS event_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE
    SET NULL,
        -- Snapshot of event data
        event_name VARCHAR(100),
        event_date DATE,
        event_type VARCHAR(50),
        guests_attended INTEGER,
        revenue NUMERIC,
        notes TEXT,
        -- Timestamps
        archived_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- 4. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_event_history_date ON event_history(event_date);
-- =============================================
-- 5. RLS POLICIES
-- =============================================
ALTER TABLE weekly_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_history ENABLE ROW LEVEL SECURITY;
-- Read access for all authenticated
CREATE POLICY "Read weekly_schedule" ON weekly_schedule FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Read events" ON events FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Read event_history" ON event_history FOR
SELECT TO authenticated USING (true);
-- Write access for admin/staff (simplified - adjust based on your auth setup)
CREATE POLICY "Manage weekly_schedule" ON weekly_schedule FOR ALL TO authenticated USING (true);
CREATE POLICY "Manage events" ON events FOR ALL TO authenticated USING (true);
CREATE POLICY "Manage event_history" ON event_history FOR ALL TO authenticated USING (true);
-- =============================================
-- 6. FUNCTION: Archive completed event
-- =============================================
CREATE OR REPLACE FUNCTION archive_completed_event(
        p_event_id UUID,
        p_guests INTEGER,
        p_revenue NUMERIC,
        p_notes TEXT
    ) RETURNS VOID AS $$ BEGIN
INSERT INTO event_history (
        event_id,
        event_name,
        event_date,
        event_type,
        guests_attended,
        revenue,
        notes
    )
SELECT id,
    name,
    event_date,
    event_type,
    p_guests,
    p_revenue,
    p_notes
FROM events
WHERE id = p_event_id;
UPDATE events
SET status = 'completed',
    updated_at = NOW()
WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql;