import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import habitations, risk, redzones, hazards, capacity
from app.api import relocation, dashboard, alerts, simulation, reports
from app.api import safezones, upload, auth

app = FastAPI(
    title="Disaster Risk Intelligence Platform",
    description="SIH26191 — Intelligent Hazard Red-Zone Identification & Relocation Decision Support",
    version="1.0.0-demo",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(habitations.router, prefix="/api/habitations", tags=["Habitations"])
app.include_router(risk.router, prefix="/api", tags=["Risk"])
app.include_router(redzones.router, prefix="/api/red-zones", tags=["Red Zones"])
app.include_router(hazards.router, prefix="/api/hazards", tags=["Hazards"])
app.include_router(capacity.router, prefix="/api/capacity", tags=["Capacity"])
app.include_router(relocation.router, prefix="/api/relocation", tags=["Relocation"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(simulation.router, prefix="/api/simulate", tags=["Simulation"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(safezones.router, prefix="/api/safe-zones", tags=["Safe Zones"])
app.include_router(upload.router, prefix="/api/upload-data", tags=["Upload"])


@app.on_event("startup")
async def startup_event():
    db_path = "app/data/database.db"
    os.makedirs("app/data", exist_ok=True)
    if not os.path.exists(db_path) or os.path.getsize(db_path) < 1000:
        print("[startup] Seeding database...")
        from app.data.seed import seed_database
        seed_database(db_path)
        print("[startup] Database ready.")


@app.get("/")
def root():
    return {
        "name": "Disaster Risk Intelligence Platform API",
        "version": "1.0.0-demo",
        "status": "running",
        "disclaimer": "Demonstration data only. Not for operational use.",
        "docs": "/docs",
    }
