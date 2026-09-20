#!/usr/bin/env python3
"""
DRIPS Data Import Toolkit
=========================
Supports: CSV, Excel (.xlsx), GeoJSON, Shapefile (via GDAL if available)

Usage:
    python3 import_data.py --file my_data.csv
    python3 import_data.py --file my_data.xlsx --sheet Sheet1
    python3 import_data.py --file my_data.geojson
    python3 import_data.py --file my_data.csv --dry-run     # validate only
    python3 import_data.py --file my_data.csv --merge        # keep existing + add new
    python3 import_data.py --reset                            # restore demo data

Run from: disaster-risk-platform/backend/
"""

import sys
import os
import json
import csv
import argparse
import sqlite3
import re
from pathlib import Path
from datetime import datetime

# ─── Configuration ────────────────────────────────────────────────────────────

DB_PATH = "app/data/database.db"
LOG_PATH = "import_log.txt"

REQUIRED_COLUMNS = {"name", "latitude", "longitude", "population"}
OPTIONAL_DEFAULTS = {
    "district":                     "Unknown",
    "state":                        "Unknown",
    "hazard_type":                  "none",
    "hazard_severity":              0.3,
    "elevation":                    100.0,
    "children_count":               0,
    "elderly_count":                0,
    "disabled_count":               0,
    "pregnant_women_count":         0,
    "below_poverty_count":          0,
    "housing_quality":              3,
    "road_accessibility":           3,
    "distance_from_hazard_km":      5.0,
    "historical_event_count":       0,
    "last_event_year":              0,
    "water_capacity_liters_per_day": None,   # auto-computed below
    "shelter_capacity_persons":     None,    # auto-computed below
    "healthcare_beds":              None,    # auto-computed below
    "evacuation_route_quality":     3,
    "food_stock_days":              7.0,
    "sanitation_coverage_pct":      60.0,
    "safe_land_area_sqkm":          1.0,
    "nearby_hospital_count":        1,
    "nearby_school_count":          2,
    "nearby_shelter_count":         1,
    "rainfall_annual_mm":           800.0,
    "slope_degrees":                2.0,
    "soil_type":                    "Alluvial",
}

VALID_HAZARD_TYPES = {"flood", "landslide", "cyclone", "drought", "earthquake",
                      "wildfire", "industrial", "multi", "none"}

# ─── Column Aliases ────────────────────────────────────────────────────────────
# Maps common alternate spellings → canonical column name

ALIASES = {
    # Name
    "village_name": "name", "habitation": "name", "habitation_name": "name",
    "village": "name", "gram": "name", "locality": "name",

    # Location
    "lat": "latitude", "lng": "longitude", "lon": "longitude",
    "long": "longitude", "x": "longitude", "y": "latitude",

    # Population
    "pop": "population", "total_population": "population",
    "population_count": "population", "households_x4": "population",

    # District / State
    "tehsil": "district", "taluka": "district", "block": "district",
    "province": "state",

    # Hazard
    "hazard": "hazard_type", "primary_hazard": "hazard_type",
    "disaster_type": "hazard_type",
    "severity": "hazard_severity", "hazard_level": "hazard_severity",

    # Vulnerable population
    "children": "children_count", "child_count": "children_count",
    "elderly": "elderly_count", "senior_count": "elderly_count",
    "disabled": "disabled_count", "pwd_count": "disabled_count",
    "pregnant": "pregnant_women_count",
    "bpl": "below_poverty_count", "bpl_households": "below_poverty_count",

    # Infrastructure
    "housing": "housing_quality", "house_quality": "housing_quality",
    "road": "road_accessibility", "road_quality": "road_accessibility",
    "road_access": "road_accessibility",
    "beds": "healthcare_beds", "hospital_beds": "healthcare_beds",
    "water": "water_capacity_liters_per_day",
    "water_supply": "water_capacity_liters_per_day",
    "shelter": "shelter_capacity_persons",
    "evac_quality": "evacuation_route_quality",
    "food": "food_stock_days", "food_days": "food_stock_days",
    "sanitation": "sanitation_coverage_pct",
    "sanitation_pct": "sanitation_coverage_pct",
    "safe_land": "safe_land_area_sqkm",

    # History
    "events": "historical_event_count", "past_events": "historical_event_count",
    "last_disaster": "last_event_year",

    # Geography
    "altitude": "elevation", "height": "elevation",
    "rainfall": "rainfall_annual_mm", "annual_rainfall": "rainfall_annual_mm",
    "slope": "slope_degrees",
}


# ─── Utility Functions ─────────────────────────────────────────────────────────

class Logger:
    def __init__(self):
        self.lines = []

    def log(self, msg, level="INFO"):
        ts = datetime.now().strftime("%H:%M:%S")
        line = f"[{ts}] {level}: {msg}"
        print(line)
        self.lines.append(line)

    def warn(self, msg): self.log(msg, "WARN")
    def error(self, msg): self.log(msg, "ERROR")
    def ok(self, msg): self.log(msg, "OK  ")

    def save(self):
        with open(LOG_PATH, "w") as f:
            f.write("\n".join(self.lines))
        print(f"\nLog saved to {LOG_PATH}")


log = Logger()


def normalize_col(col: str) -> str:
    """Lowercase, strip, replace spaces/hyphens with underscores."""
    c = col.strip().lower().replace(" ", "_").replace("-", "_")
    return ALIASES.get(c, c)


def normalize_row(raw: dict) -> dict:
    """Apply alias mapping to a raw row dict."""
    return {normalize_col(k): v for k, v in raw.items()}


def coerce(val, typ, default=None):
    """Safely cast val to typ, returning default on failure."""
    if val is None or str(val).strip() in ("", "NA", "N/A", "null", "NULL", "-"):
        return default
    try:
        return typ(str(val).strip())
    except (ValueError, TypeError):
        return default


def coerce_hazard(val):
    """Normalize hazard type string."""
    if not val:
        return "none"
    v = str(val).strip().lower()
    for h in VALID_HAZARD_TYPES:
        if h in v:
            return h
    return "none"


def auto_defaults(row: dict) -> dict:
    """Fill in auto-computed defaults based on population."""
    pop = int(row.get("population", 1000))
    row.setdefault("water_capacity_liters_per_day",  pop * 40.0)
    row.setdefault("shelter_capacity_persons",        max(50, int(pop * 0.15)))
    row.setdefault("healthcare_beds",                 max(2,  int(pop / 400)))
    row.setdefault("below_poverty_count",             max(0,  int(pop * 0.35)))
    return row


def validate_row(row: dict, idx: int) -> list:
    """Return list of validation errors for a row."""
    errors = []
    lat = coerce(row.get("latitude"), float)
    lon = coerce(row.get("longitude"), float)
    pop = coerce(row.get("population"), int)

    if lat is None: errors.append(f"Row {idx}: missing/invalid latitude")
    elif not (6.0 <= lat <= 37.0): errors.append(f"Row {idx}: latitude {lat} out of India bounds (6–37)")

    if lon is None: errors.append(f"Row {idx}: missing/invalid longitude")
    elif not (68.0 <= lon <= 98.0): errors.append(f"Row {idx}: longitude {lon} out of India bounds (68–98)")

    if pop is None: errors.append(f"Row {idx}: missing/invalid population")
    elif pop <= 0: errors.append(f"Row {idx}: population must be > 0, got {pop}")

    if not row.get("name"): errors.append(f"Row {idx}: missing name")

    haz = row.get("hazard_type")
    if haz and haz not in VALID_HAZARD_TYPES:
        errors.append(f"Row {idx}: unknown hazard_type '{haz}' — use one of {VALID_HAZARD_TYPES}")

    return errors


def clean_row(row: dict) -> dict:
    """Coerce all fields to correct Python types."""
    pop = coerce(row.get("population"), int, 1000)
    return {
        "name":                         str(row.get("name", "Unknown")).strip(),
        "district":                     str(row.get("district", "Unknown")).strip(),
        "state":                        str(row.get("state", "Unknown")).strip(),
        "latitude":                     coerce(row.get("latitude"), float, 20.0),
        "longitude":                    coerce(row.get("longitude"), float, 80.0),
        "elevation":                    coerce(row.get("elevation"), float, 100.0),
        "population":                   pop,
        "hazard_type":                  coerce_hazard(row.get("hazard_type")),
        "hazard_severity":              min(1.0, max(0.0, coerce(row.get("hazard_severity"), float, 0.3))),
        "distance_from_hazard_km":      coerce(row.get("distance_from_hazard_km"), float, 5.0),
        "children_count":               coerce(row.get("children_count"), int, int(pop * 0.25)),
        "elderly_count":                coerce(row.get("elderly_count"), int, int(pop * 0.10)),
        "disabled_count":               coerce(row.get("disabled_count"), int, int(pop * 0.03)),
        "pregnant_women_count":         coerce(row.get("pregnant_women_count"), int, int(pop * 0.015)),
        "below_poverty_count":          coerce(row.get("below_poverty_count"), int, int(pop * 0.35)),
        "housing_quality":              min(5, max(1, coerce(row.get("housing_quality"), int, 3))),
        "road_accessibility":           min(5, max(1, coerce(row.get("road_accessibility"), int, 3))),
        "historical_event_count":       coerce(row.get("historical_event_count"), int, 0),
        "last_event_year":              coerce(row.get("last_event_year"), int, 0),
        "water_capacity_liters_per_day": coerce(row.get("water_capacity_liters_per_day"), float, pop * 40.0),
        "shelter_capacity_persons":     coerce(row.get("shelter_capacity_persons"), int, max(50, int(pop * 0.15))),
        "healthcare_beds":              coerce(row.get("healthcare_beds"), int, max(2, int(pop / 400))),
        "evacuation_route_quality":     min(5, max(1, coerce(row.get("evacuation_route_quality"), int, 3))),
        "food_stock_days":              coerce(row.get("food_stock_days"), float, 7.0),
        "sanitation_coverage_pct":      min(100.0, max(0.0, coerce(row.get("sanitation_coverage_pct"), float, 60.0))),
        "safe_land_area_sqkm":          coerce(row.get("safe_land_area_sqkm"), float, 1.0),
        "nearby_hospital_count":        coerce(row.get("nearby_hospital_count"), int, 1),
        "nearby_school_count":          coerce(row.get("nearby_school_count"), int, 2),
        "nearby_shelter_count":         coerce(row.get("nearby_shelter_count"), int, 1),
        "rainfall_annual_mm":           coerce(row.get("rainfall_annual_mm"), float, 800.0),
        "slope_degrees":                coerce(row.get("slope_degrees"), float, 2.0),
        "soil_type":                    str(row.get("soil_type", "Alluvial")).strip(),
    }


# ─── File Readers ──────────────────────────────────────────────────────────────

def read_csv(path: str) -> list:
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(normalize_row(r))
    return rows


def read_excel(path: str, sheet: str = None) -> list:
    try:
        import openpyxl
    except ImportError:
        log.error("openpyxl not installed. Run: pip install openpyxl")
        sys.exit(1)

    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[sheet] if sheet else wb.active
    rows_raw = list(ws.iter_rows(values_only=True))
    if not rows_raw:
        return []
    headers = [str(c).strip() if c else "" for c in rows_raw[0]]
    rows = []
    for r in rows_raw[1:]:
        if all(v is None for v in r):
            continue
        rows.append(normalize_row(dict(zip(headers, r))))
    return rows


def read_geojson(path: str) -> list:
    with open(path, encoding="utf-8") as f:
        gj = json.load(f)
    rows = []
    for feat in gj.get("features", []):
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        if geom.get("type") == "Point":
            coords = geom.get("coordinates", [None, None])
            props["longitude"] = coords[0]
            props["latitude"]  = coords[1]
        rows.append(normalize_row(props))
    return rows


def read_json(path: str) -> list:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return [normalize_row(r) for r in data]
    if isinstance(data, dict) and "features" in data:
        return read_geojson(path)
    log.error("JSON must be a list of objects or a GeoJSON FeatureCollection")
    sys.exit(1)


def read_file(path: str, sheet: str = None) -> list:
    ext = Path(path).suffix.lower()
    if ext == ".csv":
        return read_csv(path)
    elif ext in (".xlsx", ".xls"):
        return read_excel(path, sheet)
    elif ext == ".geojson":
        return read_geojson(path)
    elif ext == ".json":
        return read_json(path)
    else:
        log.error(f"Unsupported file type: {ext}. Use .csv / .xlsx / .geojson / .json")
        sys.exit(1)


# ─── Database Operations ───────────────────────────────────────────────────────

def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def table_exists(conn, name: str) -> bool:
    cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (name,))
    return cur.fetchone() is not None


def count_rows(conn, table: str) -> int:
    if not table_exists(conn, table):
        return 0
    return conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]


def insert_habitation(conn, row: dict):
    conn.execute("""
        INSERT INTO habitations (
            name, district, state, latitude, longitude, elevation, population,
            hazard_type, hazard_severity, distance_from_hazard_km,
            children_count, elderly_count, disabled_count,
            pregnant_women_count, below_poverty_count,
            housing_quality, road_accessibility,
            historical_event_count, last_event_year,
            water_capacity_liters_per_day, shelter_capacity_persons,
            healthcare_beds, evacuation_route_quality,
            food_stock_days, sanitation_coverage_pct, safe_land_area_sqkm,
            nearby_hospital_count, nearby_school_count, nearby_shelter_count,
            rainfall_annual_mm, slope_degrees, soil_type
        ) VALUES (
            :name, :district, :state, :latitude, :longitude, :elevation, :population,
            :hazard_type, :hazard_severity, :distance_from_hazard_km,
            :children_count, :elderly_count, :disabled_count,
            :pregnant_women_count, :below_poverty_count,
            :housing_quality, :road_accessibility,
            :historical_event_count, :last_event_year,
            :water_capacity_liters_per_day, :shelter_capacity_persons,
            :healthcare_beds, :evacuation_route_quality,
            :food_stock_days, :sanitation_coverage_pct, :safe_land_area_sqkm,
            :nearby_hospital_count, :nearby_school_count, :nearby_shelter_count,
            :rainfall_annual_mm, :slope_degrees, :soil_type
        )
    """, row)


# ─── Main Logic ────────────────────────────────────────────────────────────────

def do_import(args):
    path = args.file
    if not os.path.exists(path):
        log.error(f"File not found: {path}")
        sys.exit(1)

    log.log(f"Reading file: {path}")
    raw_rows = read_file(path, getattr(args, "sheet", None))
    log.log(f"Found {len(raw_rows)} rows")

    if not raw_rows:
        log.error("No data rows found. Check your file.")
        sys.exit(1)

    # Show detected columns
    detected = set(raw_rows[0].keys())
    missing_req = REQUIRED_COLUMNS - detected
    if missing_req:
        log.error(f"Missing required columns: {missing_req}")
        log.error("Check column names or use the --map option. See README for column aliases.")
        sys.exit(1)

    log.log(f"Columns detected: {sorted(detected)}")

    # Validate
    all_errors = []
    for i, r in enumerate(raw_rows, 1):
        errors = validate_row(r, i)
        all_errors.extend(errors)

    if all_errors:
        log.warn(f"{len(all_errors)} validation issues found:")
        for e in all_errors[:20]:
            log.warn(f"  {e}")
        if len(all_errors) > 20:
            log.warn(f"  ... and {len(all_errors) - 20} more")
        if not args.force:
            log.error("Fix issues above and re-run, or use --force to import anyway (bad rows will use defaults).")
            sys.exit(1)

    # Clean
    cleaned = [clean_row(r) for r in raw_rows]

    # Dry run
    if args.dry_run:
        log.ok(f"DRY RUN: {len(cleaned)} rows validated. No data written.")
        log.log("Sample output (first row):")
        for k, v in list(cleaned[0].items())[:10]:
            log.log(f"  {k}: {v}")
        return

    # Write to DB
    conn = get_conn()
    if not table_exists(conn, "habitations"):
        log.error(f"Database tables not found at {DB_PATH}. Run 'python3 seed_db.py' first.")
        sys.exit(1)

    existing_count = count_rows(conn, "habitations")

    if not args.merge:
        log.warn(f"Replacing {existing_count} existing habitations...")
        conn.execute("DELETE FROM habitations")

    inserted = 0
    skipped  = 0
    for row in cleaned:
        try:
            insert_habitation(conn, row)
            inserted += 1
        except Exception as e:
            log.warn(f"Skipped '{row.get('name')}': {e}")
            skipped += 1

    conn.commit()
    conn.close()

    final_count = count_rows(get_conn(), "habitations")
    log.ok(f"Import complete: {inserted} inserted, {skipped} skipped. Total in DB: {final_count}")
    log.log("Restart the backend server to see your data: python3 server.py")


def do_reset(args):
    log.warn("Resetting database to demo data...")
    sys.path.insert(0, ".")
    from app.data.seed import seed_database
    seed_database(DB_PATH)
    log.ok("Demo data restored.")


def do_preview(args):
    """Show what columns were detected and how they map."""
    raw = read_file(args.file, getattr(args, "sheet", None))
    if not raw:
        log.error("No rows found.")
        return
    log.log(f"\n{'─'*60}")
    log.log("COLUMN MAPPING PREVIEW")
    log.log(f"{'─'*60}")
    log.log(f"{'Your Column':<30} → {'Mapped To':<30}")
    log.log(f"{'─'*60}")
    for orig_col in list(raw[0].keys()):
        mapped = normalize_col(orig_col)
        marker = "✓" if mapped in {**{c: c for c in OPTIONAL_DEFAULTS}, "name": "name", "latitude": "latitude", "longitude": "longitude", "population": "population"} else "?"
        log.log(f"  {orig_col:<28} → {mapped:<30} {marker}")
    log.log(f"{'─'*60}")
    log.log(f"\nTotal rows: {len(raw)}")
    log.log("Run with --dry-run to validate, or without flags to import.")


# ─── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="DRIPS Data Import Toolkit",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 import_data.py --file villages.csv
  python3 import_data.py --file data.xlsx --sheet "Sheet1"
  python3 import_data.py --file zones.geojson
  python3 import_data.py --file villages.csv --dry-run
  python3 import_data.py --file villages.csv --merge
  python3 import_data.py --file villages.csv --force
  python3 import_data.py --preview --file villages.csv
  python3 import_data.py --reset
        """
    )
    parser.add_argument("--file",      help="Path to input file (.csv, .xlsx, .geojson, .json)")
    parser.add_argument("--sheet",     help="Sheet name for Excel files (default: first sheet)")
    parser.add_argument("--dry-run",   action="store_true", help="Validate only — don't write to DB")
    parser.add_argument("--merge",     action="store_true", help="Add to existing data instead of replacing it")
    parser.add_argument("--force",     action="store_true", help="Import even if validation errors exist")
    parser.add_argument("--preview",   action="store_true", help="Show column mapping preview only")
    parser.add_argument("--reset",     action="store_true", help="Restore demo seed data")

    args = parser.parse_args()

    if args.reset:
        do_reset(args)
    elif args.preview and args.file:
        do_preview(args)
    elif args.file:
        do_import(args)
    else:
        parser.print_help()

    log.save()


if __name__ == "__main__":
    main()
