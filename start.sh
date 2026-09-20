#!/bin/bash
# ─────────────────────────────────────────────────────────
# DRIPS — One-command startup for development
# ─────────────────────────────────────────────────────────

set -e

echo ""
echo "  ██████╗ ██████╗ ██╗██████╗ ███████╗"
echo "  ██╔══██╗██╔══██╗██║██╔══██╗██╔════╝"
echo "  ██║  ██║██████╔╝██║██████╔╝███████╗"
echo "  ██║  ██║██╔══██╗██║██╔═══╝ ╚════██║"
echo "  ██████╔╝██║  ██║██║██║     ███████║"
echo "  ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝     ╚══════╝"
echo ""
echo "  Disaster Risk Intelligence Platform"
echo "  SIH 2026 — Problem SIH26191"
echo "  ─────────────────────────────────────"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# ── Backend ───────────────────────────────────────────────
echo "▶ Starting backend..."

if [ ! -f "$BACKEND_DIR/app/data/database.db" ]; then
  echo "  Database not found. Seeding demo data..."
  cd "$BACKEND_DIR"
  python3 seed_db.py
fi

cd "$BACKEND_DIR"
python3 server.py &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
echo "  Backend URL: http://localhost:8000"

# Wait for backend to be ready
sleep 2
if curl -s http://localhost:8000/api/dashboard > /dev/null 2>&1; then
  echo "  ✓ Backend is live"
else
  echo "  ⚠ Backend may still be starting..."
fi

# ── Frontend ─────────────────────────────────────────────
echo ""
echo "▶ Starting frontend..."

cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  echo "  Installing npm dependencies (first run)..."
  npm install --silent
fi

npm run dev &
FRONTEND_PID=$!

sleep 2
echo "  Frontend URL: http://localhost:5173"
echo ""
echo "─────────────────────────────────────────────────────"
echo "  ✓ DRIPS Platform is running!"
echo ""
echo "  Open: http://localhost:5173"
echo "  Login: admin / admin123"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo "─────────────────────────────────────────────────────"

# Wait and handle Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Done.'; exit 0" INT TERM
wait
