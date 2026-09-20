"""
Database schema — compatible with both SQLite and PostgreSQL (Neon).

Called by seed_db.py at startup. Safe to call multiple times (idempotent).
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.database import execute_script, USE_POSTGRES

# ─── SQLite schema (local dev) ─────────────────────────────────────────────────
SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS habitations (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    name                        TEXT NOT NULL,
    district                    TEXT NOT NULL DEFAULT 'Unknown',
    state                       TEXT NOT NULL DEFAULT 'Unknown',
    latitude                    REAL NOT NULL,
    longitude                   REAL NOT NULL,
    elevation                   REAL DEFAULT 100.0,
    population                  INTEGER NOT NULL DEFAULT 0,
    children_count              INTEGER DEFAULT 0,
    elderly_count               INTEGER DEFAULT 0,
    disabled_count              INTEGER DEFAULT 0,
    pregnant_women_count        INTEGER DEFAULT 0,
    below_poverty_count         INTEGER DEFAULT 0,
    housing_quality             INTEGER DEFAULT 3,
    road_accessibility          INTEGER DEFAULT 3,
    hazard_type                 TEXT DEFAULT 'none',
    hazard_severity             REAL DEFAULT 0.0,
    distance_from_hazard_km     REAL DEFAULT 5.0,
    historical_event_count      INTEGER DEFAULT 0,
    last_event_year             INTEGER DEFAULT 0,
    water_capacity_liters_per_day REAL DEFAULT 0,
    shelter_capacity_persons    INTEGER DEFAULT 0,
    healthcare_beds             INTEGER DEFAULT 0,
    evacuation_route_quality    INTEGER DEFAULT 3,
    food_stock_days             REAL DEFAULT 7.0,
    sanitation_coverage_pct     REAL DEFAULT 60.0,
    safe_land_area_sqkm         REAL DEFAULT 1.0,
    nearby_hospital_count       INTEGER DEFAULT 0,
    nearby_school_count         INTEGER DEFAULT 0,
    nearby_shelter_count        INTEGER DEFAULT 0,
    rainfall_annual_mm          REAL DEFAULT 800.0,
    slope_degrees               REAL DEFAULT 2.0,
    soil_type                   TEXT DEFAULT 'Alluvial',
    created_at                  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS red_zones (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    hazard_type     TEXT NOT NULL,
    risk_score      REAL DEFAULT 0.0,
    description     TEXT DEFAULT '',
    polygon_coords  TEXT DEFAULT '[]',
    area_sqkm       REAL DEFAULT 0.0,
    population_exposed INTEGER DEFAULT 0,
    severity_level  TEXT DEFAULT 'HIGH',
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS safe_zones (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT NOT NULL,
    district            TEXT DEFAULT '',
    state               TEXT DEFAULT '',
    latitude            REAL NOT NULL,
    longitude           REAL NOT NULL,
    capacity            INTEGER DEFAULT 0,
    available_capacity  INTEGER DEFAULT 0,
    safety_score        REAL DEFAULT 0.0,
    has_healthcare      INTEGER DEFAULT 0,
    has_water           INTEGER DEFAULT 0,
    has_food_supply     INTEGER DEFAULT 0,
    road_quality        INTEGER DEFAULT 3,
    created_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alerts (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    title               TEXT NOT NULL,
    message             TEXT DEFAULT '',
    severity            TEXT DEFAULT 'INFO',
    habitation_id       INTEGER DEFAULT NULL,
    population_affected INTEGER DEFAULT 0,
    recommended_action  TEXT DEFAULT '',
    acknowledged        INTEGER DEFAULT 0,
    timestamp           TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hazard_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    habitation_id   INTEGER NOT NULL,
    event_type      TEXT NOT NULL,
    year            INTEGER NOT NULL,
    severity        TEXT DEFAULT 'MODERATE',
    description     TEXT DEFAULT '',
    affected_count  INTEGER DEFAULT 0,
    damage_inr_lakh REAL DEFAULT 0.0
);
"""

# ─── PostgreSQL schema (Neon) ──────────────────────────────────────────────────
POSTGRES_SCHEMA = """
CREATE TABLE IF NOT EXISTS habitations (
    id                          SERIAL PRIMARY KEY,
    name                        TEXT NOT NULL,
    district                    TEXT NOT NULL DEFAULT 'Unknown',
    state                       TEXT NOT NULL DEFAULT 'Unknown',
    latitude                    DOUBLE PRECISION NOT NULL,
    longitude                   DOUBLE PRECISION NOT NULL,
    elevation                   DOUBLE PRECISION DEFAULT 100.0,
    population                  INTEGER NOT NULL DEFAULT 0,
    children_count              INTEGER DEFAULT 0,
    elderly_count               INTEGER DEFAULT 0,
    disabled_count              INTEGER DEFAULT 0,
    pregnant_women_count        INTEGER DEFAULT 0,
    below_poverty_count         INTEGER DEFAULT 0,
    housing_quality             INTEGER DEFAULT 3,
    road_accessibility          INTEGER DEFAULT 3,
    hazard_type                 TEXT DEFAULT 'none',
    hazard_severity             DOUBLE PRECISION DEFAULT 0.0,
    distance_from_hazard_km     DOUBLE PRECISION DEFAULT 5.0,
    historical_event_count      INTEGER DEFAULT 0,
    last_event_year             INTEGER DEFAULT 0,
    water_capacity_liters_per_day DOUBLE PRECISION DEFAULT 0,
    shelter_capacity_persons    INTEGER DEFAULT 0,
    healthcare_beds             INTEGER DEFAULT 0,
    evacuation_route_quality    INTEGER DEFAULT 3,
    food_stock_days             DOUBLE PRECISION DEFAULT 7.0,
    sanitation_coverage_pct     DOUBLE PRECISION DEFAULT 60.0,
    safe_land_area_sqkm         DOUBLE PRECISION DEFAULT 1.0,
    nearby_hospital_count       INTEGER DEFAULT 0,
    nearby_school_count         INTEGER DEFAULT 0,
    nearby_shelter_count        INTEGER DEFAULT 0,
    rainfall_annual_mm          DOUBLE PRECISION DEFAULT 800.0,
    slope_degrees               DOUBLE PRECISION DEFAULT 2.0,
    soil_type                   TEXT DEFAULT 'Alluvial',
    created_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS red_zones (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    hazard_type     TEXT NOT NULL,
    risk_score      DOUBLE PRECISION DEFAULT 0.0,
    description     TEXT DEFAULT '',
    polygon_coords  TEXT DEFAULT '[]',
    area_sqkm       DOUBLE PRECISION DEFAULT 0.0,
    population_exposed INTEGER DEFAULT 0,
    severity_level  TEXT DEFAULT 'HIGH',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safe_zones (
    id                  SERIAL PRIMARY KEY,
    name                TEXT NOT NULL,
    district            TEXT DEFAULT '',
    state               TEXT DEFAULT '',
    latitude            DOUBLE PRECISION NOT NULL,
    longitude           DOUBLE PRECISION NOT NULL,
    capacity            INTEGER DEFAULT 0,
    available_capacity  INTEGER DEFAULT 0,
    safety_score        DOUBLE PRECISION DEFAULT 0.0,
    has_healthcare      BOOLEAN DEFAULT FALSE,
    has_water           BOOLEAN DEFAULT FALSE,
    has_food_supply     BOOLEAN DEFAULT FALSE,
    road_quality        INTEGER DEFAULT 3,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id                  SERIAL PRIMARY KEY,
    title               TEXT NOT NULL,
    message             TEXT DEFAULT '',
    severity            TEXT DEFAULT 'INFO',
    habitation_id       INTEGER DEFAULT NULL,
    population_affected INTEGER DEFAULT 0,
    recommended_action  TEXT DEFAULT '',
    acknowledged        BOOLEAN DEFAULT FALSE,
    timestamp           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hazard_events (
    id              SERIAL PRIMARY KEY,
    habitation_id   INTEGER NOT NULL,
    event_type      TEXT NOT NULL,
    year            INTEGER NOT NULL,
    severity        TEXT DEFAULT 'MODERATE',
    description     TEXT DEFAULT '',
    affected_count  INTEGER DEFAULT 0,
    damage_inr_lakh DOUBLE PRECISION DEFAULT 0.0
);
"""


def create_schema():
    """Create all tables. Idempotent — safe to call on every startup."""
    schema = POSTGRES_SCHEMA if USE_POSTGRES else SQLITE_SCHEMA
    print(f"Creating schema ({'PostgreSQL' if USE_POSTGRES else 'SQLite'})...")
    execute_script(schema)
    print("Schema ready.")
