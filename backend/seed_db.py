#!/usr/bin/env python3
"""
Entry point: seeds the database and optionally starts the server.
Run: python seed_db.py
"""
import os
import sys

if __name__ == "__main__":
    db_path = "app/data/database.db"
    os.makedirs("app/data", exist_ok=True)
    # Always re-seed if --force flag passed or DB is very small
    force = "--force" in sys.argv
    if force and os.path.exists(db_path):
        os.remove(db_path)
        print("[seed] Removed existing database.")
    from app.data.seed import seed_database
    seed_database(db_path)
    print("[seed] Done. Run: uvicorn app.main:app --reload --port 8000")
