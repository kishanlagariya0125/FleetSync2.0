-- =============================================
-- FleetSync 2.0  ·  Multi-Tenant SaaS Schema
-- =============================================

-- FLEETS (one row per company / tenant)
CREATE TABLE IF NOT EXISTS fleets (
    id         SERIAL PRIMARY KEY,
    fleet_name VARCHAR(120) NOT NULL,
    owner_id   INT,                      -- FK set after users insert
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(120) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL CHECK (
                   role IN ('OWNER','MANAGER','DISPATCHER','DRIVER','FINANCE')
               ),
    fleet_id   INT,                      -- NULL until assigned to a fleet
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_fleet
        FOREIGN KEY (fleet_id)
        REFERENCES fleets(id)
        ON DELETE SET NULL
);

-- Back-fill FLEET owner_id FK
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_fleet_owner'
    ) THEN
        ALTER TABLE fleets
            ADD CONSTRAINT fk_fleet_owner
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
    id           SERIAL PRIMARY KEY,
    fleet_id     INT NOT NULL,
    name         VARCHAR(100) NOT NULL,
    plate_number VARCHAR(50)  NOT NULL,
    capacity     INT NOT NULL CHECK (capacity > 0),
    status       VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE'
                     CHECK (status IN ('AVAILABLE','ON_TRIP','IN_SHOP','RETIRED')),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_vehicle_fleet
        FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE CASCADE,

    CONSTRAINT uq_plate_per_fleet UNIQUE (fleet_id, plate_number)
);

-- DRIVERS
CREATE TABLE IF NOT EXISTS drivers (
    id             SERIAL PRIMARY KEY,
    fleet_id       INT NOT NULL,
    user_id        INT UNIQUE,
    name           VARCHAR(100) NOT NULL,
    license_number VARCHAR(50)  NOT NULL,
    license_expiry DATE NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE'
                       CHECK (status IN ('AVAILABLE','ON_TRIP','SUSPENDED')),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_driver_fleet
        FOREIGN KEY (fleet_id) REFERENCES fleets(id) ON DELETE CASCADE,
    CONSTRAINT fk_driver_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- TRIPS
CREATE TABLE IF NOT EXISTS trips (
    id            SERIAL PRIMARY KEY,
    fleet_id      INT NOT NULL,
    vehicle_id    INT,
    driver_id     INT,
    origin        VARCHAR(150) NOT NULL,
    destination   VARCHAR(150) NOT NULL,
    cargo_weight  INT NOT NULL CHECK (cargo_weight > 0),
    status        VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
                      CHECK (status IN ('DRAFT','DISPATCHED','COMPLETED','CANCELLED')),
    dispatch_time TIMESTAMP,
    complete_time TIMESTAMP,
    created_by    INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_trip_fleet    FOREIGN KEY (fleet_id)   REFERENCES fleets(id)   ON DELETE CASCADE,
    CONSTRAINT fk_trip_vehicle  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    CONSTRAINT fk_trip_driver   FOREIGN KEY (driver_id)  REFERENCES drivers(id)  ON DELETE SET NULL,
    CONSTRAINT fk_trip_creator  FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
);

-- MAINTENANCE LOGS
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id          SERIAL PRIMARY KEY,
    fleet_id    INT NOT NULL,
    vehicle_id  INT NOT NULL,
    description TEXT NOT NULL,
    cost        INT  DEFAULT 0 CHECK (cost >= 0),
    created_by  INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_maint_fleet   FOREIGN KEY (fleet_id)   REFERENCES fleets(id)   ON DELETE CASCADE,
    CONSTRAINT fk_maint_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_maint_user    FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
);

-- FUEL LOGS
CREATE TABLE IF NOT EXISTS fuel_logs (
    id         SERIAL PRIMARY KEY,
    fleet_id   INT NOT NULL,
    vehicle_id INT NOT NULL,
    liters     INT NOT NULL CHECK (liters > 0),
    cost       INT NOT NULL CHECK (cost >= 0),
    trip_id    INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fuel_fleet   FOREIGN KEY (fleet_id)   REFERENCES fleets(id)   ON DELETE CASCADE,
    CONSTRAINT fk_fuel_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_fuel_trip    FOREIGN KEY (trip_id)    REFERENCES trips(id)     ON DELETE SET NULL,
    CONSTRAINT fk_fuel_user    FOREIGN KEY (created_by) REFERENCES users(id)     ON DELETE SET NULL
);

-- =============================================
-- INDEXES (Production Performance)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_fleet        ON users(fleet_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_fleet      ON vehicles(fleet_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_status     ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_driver_fleet       ON drivers(fleet_id);
CREATE INDEX IF NOT EXISTS idx_driver_status      ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_trip_fleet         ON trips(fleet_id);
CREATE INDEX IF NOT EXISTS idx_trip_status        ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_vehicle       ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trip_driver        ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_fleet         ON fuel_logs(fleet_id);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle       ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maint_fleet        ON maintenance_logs(fleet_id);
CREATE INDEX IF NOT EXISTS idx_maint_vehicle      ON maintenance_logs(vehicle_id);