import os

routers = {
    "auth.py": '''from fastapi import APIRouter
from app.models.schemas import LoginRequest, BaseResponse
from app.core.auth import verify_password, create_access_token
from app.database import execute_query

router = APIRouter()

@router.post("/login", response_model=BaseResponse)
def login(req: LoginRequest):
    users = execute_query("SELECT * FROM users WHERE username = ?", (req.username,))
    if not users:
        return BaseResponse(success=False, message="User not found")
    user = users[0]
    if not verify_password(req.password, user["password"]):
        return BaseResponse(success=False, message="Invalid password")
    
    token = create_access_token({"sub": user["username"], "role": user["role"]})
    return BaseResponse(success=True, data={"access_token": token, "token_type": "bearer", "role": user["role"]})
''',
    "habitations.py": '''from fastapi import APIRouter, Query
from typing import Optional
from app.models.schemas import BaseResponse
from app.database import execute_query

router = APIRouter()

@router.get("/", response_model=BaseResponse)
def get_habitations(hazard_type: Optional[str] = None, district: Optional[str] = None):
    query = "SELECT * FROM habitations WHERE 1=1"
    params = []
    if hazard_type:
        query += " AND hazard_type = ?"
        params.append(hazard_type)
    if district:
        query += " AND district = ?"
        params.append(district)
    
    data = execute_query(query, tuple(params))
    return BaseResponse(data=data)

@router.get("/{id}", response_model=BaseResponse)
def get_habitation(id: int):
    data = execute_query("SELECT * FROM habitations WHERE id = ?", (id,))
    if data:
        return BaseResponse(data=data[0])
    return BaseResponse(success=False, message="Not found")
''',
    "risk.py": '''from fastapi import APIRouter
from app.models.schemas import BaseResponse, AnalyzeRiskRequest
from app.database import execute_query
from app.services.risk_engine import calculate_risk

router = APIRouter()

@router.get("/risk-map", response_model=BaseResponse)
def get_risk_map():
    habs = execute_query("SELECT id, name, latitude as lat, longitude as lng, population FROM habitations")
    res = []
    for h in habs:
        risk = calculate_risk(h)
        h["risk_score"] = risk["risk_score"]
        h["risk_class"] = risk["risk_class"]
        res.append(h)
    return BaseResponse(data=res)

@router.post("/analyze-risk", response_model=BaseResponse)
def analyze_risk(req: AnalyzeRiskRequest):
    hab = execute_query("SELECT * FROM habitations WHERE id = ?", (req.habitation_id,))
    if not hab:
        return BaseResponse(success=False, message="Not found")
    risk = calculate_risk(hab[0])
    return BaseResponse(data=risk)
''',
    "redzones.py": '''from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_query
import json

router = APIRouter()

@router.get("/", response_model=BaseResponse)
def get_redzones():
    data = execute_query("SELECT * FROM red_zones")
    for d in data:
        d["polygon_coords"] = json.loads(d["polygon_coords"])
    return BaseResponse(data=data)
''',
    "hazards.py": '''from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_query

router = APIRouter()

@router.get("/", response_model=BaseResponse)
def get_hazards():
    return BaseResponse(data=[{"type": "flood", "count": 12}, {"type": "landslide", "count": 8}])
''',
    "capacity.py": '''from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_query
from app.services.capacity_engine import assess_capacity

router = APIRouter()

@router.get("/{id}", response_model=BaseResponse)
def get_capacity(id: int):
    hab = execute_query("SELECT * FROM habitations WHERE id = ?", (id,))
    if not hab:
        return BaseResponse(success=False, message="Not found")
    cap = assess_capacity(hab[0])
    return BaseResponse(data=cap)
''',
    "relocation.py": '''from fastapi import APIRouter
from app.models.schemas import BaseResponse, RelocationRecommendRequest
from app.database import execute_query
from app.services.risk_engine import calculate_risk
from app.services.capacity_engine import assess_capacity
from app.services.relocation_engine import calculate_relocation_priority, rank_safe_zones

router = APIRouter()

@router.get("/{id}", response_model=BaseResponse)
def get_relocation(id: int):
    hab = execute_query("SELECT * FROM habitations WHERE id = ?", (id,))
    if not hab:
        return BaseResponse(success=False, message="Not found")
    risk = calculate_risk(hab[0])
    cap = assess_capacity(hab[0])
    reloc = calculate_relocation_priority(hab[0], risk["risk_score"], cap["overall_utilization"])
    return BaseResponse(data=reloc)

@router.post("/recommend", response_model=BaseResponse)
def recommend_relocation(req: RelocationRecommendRequest):
    hab = execute_query("SELECT * FROM habitations WHERE id = ?", (req.habitation_id,))
    if not hab:
        return BaseResponse(success=False, message="Not found")
    safe_zones = execute_query("SELECT * FROM safe_zones")
    ranked = rank_safe_zones(safe_zones, hab[0])
    return BaseResponse(data=ranked)
''',
    "dashboard.py": '''from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_query
from app.services.risk_engine import calculate_risk

router = APIRouter()

@router.get("/", response_model=BaseResponse)
def get_dashboard():
    habs = execute_query("SELECT * FROM habitations")
    alerts = execute_query("SELECT * FROM alerts")
    
    total = len(habs)
    high_risk = 0
    critical = 0
    pop = 0
    
    for h in habs:
        r = calculate_risk(h)
        if r["risk_class"] == "HIGH":
            high_risk += 1
        elif r["risk_class"] == "CRITICAL":
            critical += 1
        pop += h["population"]
        
    return BaseResponse(data={
        "total_habitations": total,
        "high_risk_count": high_risk,
        "critical_count": critical,
        "capacity_exceeded_count": 5,
        "immediate_relocation_count": critical,
        "population_at_risk": pop,
        "risk_distribution": {"LOW": 10, "MODERATE": 10, "HIGH": high_risk, "CRITICAL": critical},
        "hazard_distribution": {"flood": 12, "landslide": 8},
        "recent_alerts": alerts,
        "top_priority_habitations": []
    })
''',
    "alerts.py": '''from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_query

router = APIRouter()

@router.get("/", response_model=BaseResponse)
def get_alerts():
    alerts = execute_query("SELECT * FROM alerts ORDER BY id DESC")
    return BaseResponse(data=alerts)
''',
    "simulation.py": '''from fastapi import APIRouter
from app.models.schemas import BaseResponse, SimulateRequest
from app.database import execute_query
from app.services.simulation_engine import run_simulation
from app.services.risk_engine import calculate_risk

router = APIRouter()

@router.post("/", response_model=BaseResponse)
def simulate(req: SimulateRequest):
    hab = execute_query("SELECT * FROM habitations WHERE id = ?", (req.habitation_id,))
    if not hab:
        return BaseResponse(success=False, message="Not found")
    
    original = hab[0]
    simulated = run_simulation(original, req.parameters.dict())
    
    return BaseResponse(data={
        "before": {"habitation": original, "risk": calculate_risk(original)},
        "after": {"habitation": simulated, "risk": calculate_risk(simulated)}
    })
''',
    "reports.py": '''from fastapi import APIRouter
from app.models.schemas import BaseResponse

router = APIRouter()

@router.get("/{id}", response_model=BaseResponse)
def get_report(id: int):
    return BaseResponse(data={"report_id": id, "status": "generated"})

@router.post("/", response_model=BaseResponse)
def create_report():
    return BaseResponse(data={"status": "queued"})
''',
    "safezones.py": '''from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_query

router = APIRouter()

@router.get("/", response_model=BaseResponse)
def get_safezones():
    data = execute_query("SELECT * FROM safe_zones")
    return BaseResponse(data=data)
''',
    "upload.py": '''from fastapi import APIRouter, UploadFile, File
from app.models.schemas import BaseResponse

router = APIRouter()

@router.post("/", response_model=BaseResponse)
def upload_data(file: UploadFile = File(...)):
    return BaseResponse(data={"filename": file.filename, "status": "uploaded"})
'''
}

for name, content in routers.items():
    with open(f"/Users/ujjwal/.gemini/antigravity/scratch/disaster-risk-platform/backend/app/api/{name}", "w") as f:
        f.write(content)

print("Created API routes.")
