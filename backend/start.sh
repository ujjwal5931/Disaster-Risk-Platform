#!/bin/bash
python3 seed_db.py
uvicorn app.main:app --reload --port 8000
