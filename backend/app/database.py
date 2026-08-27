import sqlite3
import json
from typing import Any, Dict, List, Optional

DB_PATH = "app/data/database.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def execute_query(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def execute_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    rows = execute_query(query, params)
    return rows[0] if rows else None


def execute_write(query: str, params: tuple = ()) -> int:
    conn = get_connection()
    try:
        cursor = conn.execute(query, params)
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()
