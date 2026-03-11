-- =============================================
-- FleetSync 2.0  ·  MIGRATION: Single→Multi-Tenant
-- Fully idempotent — safe to run multiple times
-- =============================================

BEGIN;

-- ── 1. FIX ROLE CONSTRAINT FIRST (must allow OWNER before any INSERT) ─
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('OWNER','MANAGER','DISPATCHER','DRIVER','FINANCE'));

-- ── 2. CREATE FLEETS TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fleets (
    id         SERIAL PRIMARY KEY,
    fleet_name VARCHAR(120) NOT NULL,
    owner_id   INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. ADD fleet_id TO USERS ─────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS fleet_id INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ── 4. ADD fleet_id + created_by TO ALL DOMAIN TABLES ────────────────
ALTER TABLE vehicles         ADD COLUMN IF NOT EXISTS fleet_id INT;
ALTER TABLE drivers          ADD COLUMN IF NOT EXISTS fleet_id INT;
ALTER TABLE trips            ADD COLUMN IF NOT EXISTS fleet_id INT;
ALTER TABLE trips            ADD COLUMN IF NOT EXISTS created_by INT;
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS fleet_id INT;
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS created_by INT;
ALTER TABLE fuel_logs        ADD COLUMN IF NOT EXISTS fleet_id INT;
ALTER TABLE fuel_logs        ADD COLUMN IF NOT EXISTS created_by INT;

-- ── 5. SEED A DEFAULT FLEET + BACK-FILL DATA ─────────────────────────
DO $$
DECLARE
    def_fleet   INT;
    first_user  INT;
BEGIN
    -- Only seed if no fleets exist yet (old DB upgrade path)
    IF NOT EXISTS (SELECT 1 FROM fleets LIMIT 1) THEN

        -- Promote the first existing user to OWNER
        SELECT id INTO first_user
        FROM users
        ORDER BY created_at
        LIMIT 1;

        IF first_user IS NOT NULL THEN
            UPDATE users SET role = 'OWNER' WHERE id = first_user;
        END IF;

        -- Create a default fleet owned by that user
        INSERT INTO fleets (fleet_name, owner_id)
        VALUES ('Default Fleet', first_user)
        RETURNING id INTO def_fleet;

        -- Back-fill all existing rows with this fleet
        UPDATE users             SET fleet_id = def_fleet WHERE fleet_id IS NULL;
        UPDATE vehicles          SET fleet_id = def_fleet WHERE fleet_id IS NULL;
        UPDATE drivers           SET fleet_id = def_fleet WHERE fleet_id IS NULL;
        UPDATE trips             SET fleet_id = def_fleet WHERE fleet_id IS NULL;
        UPDATE maintenance_logs  SET fleet_id = def_fleet WHERE fleet_id IS NULL;
        UPDATE fuel_logs         SET fleet_id = def_fleet WHERE fleet_id IS NULL;
    END IF;
END $$;

-- ── 6. ADD NOT-NULL TO DOMAIN TABLES (only where data is backfilled) ─
-- NOTE: We skip users.fleet_id NOT NULL — new users start with fleet_id=NULL
-- until they join/create a fleet.

-- Only add NOT NULL if column has no nulls (safe guard)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vehicles WHERE fleet_id IS NULL LIMIT 1) THEN
        ALTER TABLE vehicles ALTER COLUMN fleet_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM drivers WHERE fleet_id IS NULL LIMIT 1) THEN
        ALTER TABLE drivers ALTER COLUMN fleet_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM trips WHERE fleet_id IS NULL LIMIT 1) THEN
        ALTER TABLE trips ALTER COLUMN fleet_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM maintenance_logs WHERE fleet_id IS NULL LIMIT 1) THEN
        ALTER TABLE maintenance_logs ALTER COLUMN fleet_id SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM fuel_logs WHERE fleet_id IS NULL LIMIT 1) THEN
        ALTER TABLE fuel_logs ALTER COLUMN fleet_id SET NOT NULL;
    END IF;
END $$;

-- ── 7. ADD FK CONSTRAINTS (idempotent) ───────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_fleet_owner') THEN
        ALTER TABLE fleets ADD CONSTRAINT fk_fleet_owner
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_fleet') THEN
        ALTER TABLE users ADD CONSTRAINT fk_user_fleet
            FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_vehicle_fleet') THEN
        ALTER TABLE vehicles ADD CONSTRAINT fk_vehicle_fleet
            FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_driver_fleet') THEN
        ALTER TABLE drivers ADD CONSTRAINT fk_driver_fleet
            FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_trip_fleet') THEN
        ALTER TABLE trips ADD CONSTRAINT fk_trip_fleet
            FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_maint_fleet') THEN
        ALTER TABLE maintenance_logs ADD CONSTRAINT fk_maint_fleet
            FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_fuel_fleet') THEN
        ALTER TABLE fuel_logs ADD CONSTRAINT fk_fuel_fleet
            FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ── 8. PLATE UNIQUENESS PER FLEET ────────────────────────────────────
-- Drop old global unique constraint if it exists
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_plate_number_key;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_plate_per_fleet') THEN
        ALTER TABLE vehicles ADD CONSTRAINT uq_plate_per_fleet
            UNIQUE (fleet_id, plate_number);
    END IF;
END $$;

-- ── 9. INDEXES ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_fleet   ON users(fleet_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_fleet ON vehicles(fleet_id);
CREATE INDEX IF NOT EXISTS idx_driver_fleet  ON drivers(fleet_id);
CREATE INDEX IF NOT EXISTS idx_trip_fleet    ON trips(fleet_id);
CREATE INDEX IF NOT EXISTS idx_fuel_fleet    ON fuel_logs(fleet_id);
CREATE INDEX IF NOT EXISTS idx_maint_fleet   ON maintenance_logs(fleet_id);

COMMIT;
