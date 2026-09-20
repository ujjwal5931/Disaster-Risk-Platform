#!/usr/bin/env python3
"""
DRIPS — Database seeder entry point.

Works with both SQLite (local) and PostgreSQL (Neon via DATABASE_URL).

Usage:
    python3 seed_db.py              # seed only if empty
    python3 seed_db.py --force      # always re-seed (drop + recreate)
    python3 seed_db.py --check      # show DB status and exit

The server (server.py) also calls this on startup automatically,
so you don't need to run this manually on Render.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))


def main():
    from app.database import USE_POSTGRES, count_rows, db_info, execute_write

    force = "--force" in sys.argv
    check = "--check" in sys.argv

    print(f"[seed] Database mode: {'PostgreSQL (Neon)' if USE_POSTGRES else 'SQLite (local)'}")

    if check:
        info = db_info()
        print(f"[seed] Status: {info}")
        return

    # Create schema (idempotent)
    from app.data.schema import create_schema
    create_schema()

    # Check if already seeded
    existing = count_rows("habitations")

    if existing > 0 and not force:
        print(f"[seed] Database already has {existing} habitations — skipping seed.")
        print("[seed] Use --force to re-seed.")
        return

    if force and existing > 0:
        print(f"[seed] Force flag — clearing {existing} existing rows...")
        execute_write("DELETE FROM hazard_events")
        execute_write("DELETE FROM alerts")
        execute_write("DELETE FROM safe_zones")
        execute_write("DELETE FROM red_zones")
        execute_write("DELETE FROM habitations")

    # Run the actual seed
    from app.data.seed import seed_database
    seed_database()
    print(f"[seed] Done. Habitations: {count_rows('habitations')}")


if __name__ == "__main__":
    main()
