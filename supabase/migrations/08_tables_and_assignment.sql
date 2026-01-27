-- Migration: Add tables table and table_id to bookings
-- Purpose: Enable table assignment for reservations
-- 1. Create tables table
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    seats INTEGER NOT NULL DEFAULT 4,
    position_x NUMERIC DEFAULT 0,
    position_y NUMERIC DEFAULT 0,
    width NUMERIC DEFAULT 80,
    height NUMERIC DEFAULT 80,
    shape VARCHAR(20) DEFAULT 'square' CHECK (shape IN ('rectangle', 'circle', 'square')),
    rotation NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Add table_id column to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES tables(id) ON DELETE
SET NULL;
-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_table_id ON bookings(table_id);
CREATE INDEX IF NOT EXISTS idx_tables_zone_id ON tables(zone_id);
-- 4. RLS Policies for tables
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
-- Allow authenticated users to read tables
CREATE POLICY "Allow authenticated users to read tables" ON tables FOR
SELECT TO authenticated USING (true);
-- Allow admin/staff to manage tables
CREATE POLICY "Allow admin to manage tables" ON tables FOR ALL TO authenticated USING (
    (
        SELECT role
        FROM auth.users
        WHERE id = auth.uid()
    ) IN ('admin', 'staff')
);
-- 5. Seed default tables (matching current floorplan data)
-- Salon tables
INSERT INTO tables (
        zone_id,
        name,
        seats,
        position_x,
        position_y,
        width,
        height,
        shape,
        rotation,
        display_order
    )
SELECT z.id,
    t.name,
    t.seats,
    t.position_x,
    t.position_y,
    t.width,
    t.height,
    t.shape,
    t.rotation,
    t.display_order
FROM zones z
    CROSS JOIN (
        VALUES ('Mesa 1', 4, 50, 50, 80, 80, 'square', 0, 1),
            ('Mesa 2', 4, 160, 50, 80, 80, 'square', 0, 2),
            ('Mesa 3', 6, 270, 50, 100, 80, 'rectangle', 0, 3),
            ('Mesa 4', 2, 50, 160, 60, 60, 'circle', 0, 4),
            ('Mesa 5', 4, 140, 160, 80, 80, 'square', 0, 5),
            (
                'Mesa 6',
                8,
                250,
                160,
                120,
                80,
                'rectangle',
                0,
                6
            )
    ) AS t(
        name,
        seats,
        position_x,
        position_y,
        width,
        height,
        shape,
        rotation,
        display_order
    )
WHERE z.slug = 'salon' ON CONFLICT DO NOTHING;
-- Pergola tables
INSERT INTO tables (
        zone_id,
        name,
        seats,
        position_x,
        position_y,
        width,
        height,
        shape,
        rotation,
        display_order
    )
SELECT z.id,
    t.name,
    t.seats,
    t.position_x,
    t.position_y,
    t.width,
    t.height,
    t.shape,
    t.rotation,
    t.display_order
FROM zones z
    CROSS JOIN (
        VALUES ('Pérgola 1', 4, 50, 50, 80, 80, 'square', 0, 1),
            (
                'Pérgola 2',
                6,
                160,
                50,
                100,
                80,
                'rectangle',
                0,
                2
            ),
            ('Pérgola 3', 4, 290, 50, 80, 80, 'square', 0, 3)
    ) AS t(
        name,
        seats,
        position_x,
        position_y,
        width,
        height,
        shape,
        rotation,
        display_order
    )
WHERE z.slug = 'pergola' ON CONFLICT DO NOTHING;
-- Barra tables
INSERT INTO tables (
        zone_id,
        name,
        seats,
        position_x,
        position_y,
        width,
        height,
        shape,
        rotation,
        display_order
    )
SELECT z.id,
    t.name,
    t.seats,
    t.position_x,
    t.position_y,
    t.width,
    t.height,
    t.shape,
    t.rotation,
    t.display_order
FROM zones z
    CROSS JOIN (
        VALUES ('Barra 1', 2, 50, 50, 60, 40, 'rectangle', 0, 1),
            ('Barra 2', 2, 130, 50, 60, 40, 'rectangle', 0, 2),
            ('Barra 3', 2, 210, 50, 60, 40, 'rectangle', 0, 3)
    ) AS t(
        name,
        seats,
        position_x,
        position_y,
        width,
        height,
        shape,
        rotation,
        display_order
    )
WHERE z.slug = 'barra' ON CONFLICT DO NOTHING;