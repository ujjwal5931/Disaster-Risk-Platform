"""
Dual-database adapter — SQLite (local dev) or PostgreSQL (Neon on Render).

Set the DATABASE_URL environment variable to switch to PostgreSQL:
  export DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

Without DATABASE_URL, falls back to local SQLite at app/data/database.db.
"""

import os
import sqlite3
import json
from typing import Any, Dict, List, Optional

# ─── Detect mode ──────────────────────────────────────────────────────────────

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
USE_POSTGRES  = DATABASE_URL.startswith("postgresql") or DATABASE_URL.startswith("postgres")
SQLITE_PATH   = os.environ.get("SQLITE_PATH", "app/data/database.db")

# ─── PostgreSQL placeholder fix ───────────────────────────────────────────────
# SQLite uses  ?  while psycopg2 uses  %s
# We write all queries with ? and auto-convert for Postgres.

def _pg_sql(query: str) -> str:
    """Replace ? placeholders with %s for psycopg2."""
    return query.replace("?", "%s")


# ─── SQLite helpers ───────────────────────────────────────────────────────────

def _sqlite_conn():
    os.makedirs(os.path.dirname(SQLITE_PATH), exist_ok=True)
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


# ─── PostgreSQL helpers ───────────────────────────────────────────────────────

_pg_pool = None

def _get_pg_conn():
    """Return a new psycopg2 connection. Connection pooling via module-level pool."""
    try:
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(DATABASE_URL, sslmode="require")
        conn.autocommit = False
        return conn
    except ImportError:
        raise RuntimeError(
            "psycopg2 not installed. Run: pip install psycopg2-binary"
        )


# ─── Public API ───────────────────────────────────────────────────────────────

def execute_query(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Run a SELECT and return list of dicts."""
    if USE_POSTGRES:
        import psycopg2.extras
        conn = _get_pg_conn()
        try:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(_pg_sql(query), params)
            rows = cur.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()
    else:
        conn = _sqlite_conn()
        try:
            cur = conn.execute(query, params)
            return [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()


def execute_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """Run a SELECT and return first row as dict, or None."""
    rows = execute_query(query, params)
    return rows[0] if rows else None


def execute_write(query: str, params: tuple = ()) -> int:
    """Run an INSERT/UPDATE/DELETE. Returns last inserted row id (or 0)."""
    if USE_POSTGRES:
        conn = _get_pg_conn()
        try:
            cur = conn.cursor()
            # For INSERT ... RETURNING id
            pg_query = _pg_sql(query)
            if query.strip().upper().startswith("INSERT") and "RETURNING" not in query.upper():
                pg_query += " RETURNING id"
            cur.execute(pg_query, params)
            conn.commit()
            if cur.description:
                row = cur.fetchone()
                return row[0] if row else 0
            return 0
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        conn = _sqlite_conn()
        try:
            cur = conn.execute(query, params)
            conn.commit()
            return cur.lastrowid or 0
        finally:
            conn.close()


def execute_many(query: str, params_list: List[tuple]) -> None:
    """Batch insert. Much faster than calling execute_write in a loop."""
    if not params_list:
        return
    if USE_POSTGRES:
        conn = _get_pg_conn()
        try:
            cur = conn.cursor()
            pg_query = _pg_sql(query)
            cur.executemany(pg_query, params_list)
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        conn = _sqlite_conn()
        try:
            conn.executemany(query, params_list)
            conn.commit()
        finally:
            conn.close()


def execute_script(sql: str) -> None:
    """Execute a multi-statement SQL script (CREATE TABLE etc.)."""
    if USE_POSTGRES:
        conn = _get_pg_conn()
        try:
            cur = conn.cursor()
            cur.execute(sql)
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        conn = _sqlite_conn()
        try:
            conn.executescript(sql)
            conn.commit()
        finally:
            conn.close()


def table_exists(table: str) -> bool:
    """Check if a table exists in the database."""
    if USE_POSTGRES:
        rows = execute_query(
            "SELECT 1 FROM information_schema.tables WHERE table_name = ?",
            (table,)
        )
    else:
        rows = execute_query(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
            (table,)
        )
    return len(rows) > 0


def count_rows(table: str) -> int:
    """Return row count for a table."""
    if not table_exists(table):
        return 0
    row = execute_one(f"SELECT COUNT(*) AS n FROM {table}")
    return row["n"] if row else 0


def db_info() -> Dict[str, Any]:
    """Return info about the current database connection."""
    return {
        "mode": "postgresql" if USE_POSTGRES else "sqlite",
        "url": DATABASE_URL[:40] + "..." if USE_POSTGRES and len(DATABASE_URL) > 40 else SQLITE_PATH,
        "habitations": count_rows("habitations"),
        "red_zones":   count_rows("red_zones"),
        "safe_zones":  count_rows("safe_zones"),
    }
