from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_query
from app.services.risk_engine import calculate_risk
from app.services.capacity_engine import calculate_capacity
from app.services.relocation_engine import calculate_relocation_priority

router = APIRouter()

DEMO_STATS = {
    "total_habitations": 50,
    "high_risk_count": 21,
    "critical_count": 11,
    "capacity_exceeded_count": 18,
    "immediate_relocation_count": 7,
    "population_at_risk": 78420,
    "risk_distribution": {
        "LOW": 8,
        "MODERATE": 21,
        "HIGH": 10,
        "CRITICAL": 11
    },
    "hazard_distribution": {
        "Flood": 12,
        "Landslide": 8,
        "Cyclone": 8,
        "Drought": 7,
        "Industrial": 6,
        "Multi-Hazard": 5,
        "None": 4
    },
}


@router.get("/", response_model=BaseResponse)
def get_dashboard():
    habs = execute_query("SELECT * FROM habitations")
    alerts = execute_query(
        "SELECT * FROM alerts ORDER BY "
        "CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'WARNING' THEN 3 ELSE 4 END "
        "LIMIT 5"
    )

    total_pop = 0
    high_risk = 0
    critical = 0
    cap_exceeded = 0
    immediate = 0
    priority_list = []
    risk_dist = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0}
    hazard_dist: dict = {}

    for h in habs:
        risk = calculate_risk(h)
        cap = calculate_capacity(h)
        pop = int(h.get("population", 0))
        total_pop += pop

        rc = risk["risk_class"]
        risk_dist[rc] = risk_dist.get(rc, 0) + 1

        htype = str(h.get("hazard_type", "none")).replace("none", "None").replace("multi", "Multi-Hazard").title()
        hazard_dist[htype] = hazard_dist.get(htype, 0) + 1

        if rc == "HIGH":
            high_risk += 1
        elif rc == "CRITICAL":
            critical += 1

        if cap["overall_utilization"] > 100:
            cap_exceeded += 1

        rel = calculate_relocation_priority(h, risk, cap)
        if rel["priority"] == "P1-IMMEDIATE":
            immediate += 1

        priority_list.append({
            "id": h["id"],
            "name": h["name"],
            "district": h["district"],
            "state": h["state"],
            "population": pop,
            "risk_score": risk["risk_score"],
            "risk_class": rc,
            "hazard_type": h.get("hazard_type"),
            "capacity_utilization": cap["overall_utilization"],
            "capacity_status": cap["overall_status"],
            "relocation_priority": rel["priority"],
        })

    priority_list.sort(key=lambda x: x["risk_score"], reverse=True)

    return BaseResponse(data={
        "total_habitations": len(habs),
        "high_risk_count": high_risk,
        "critical_count": critical,
        "capacity_exceeded_count": cap_exceeded,
        "immediate_relocation_count": immediate,
        "population_at_risk": sum(
            h["population"] for h in priority_list if h["risk_class"] in ("HIGH", "CRITICAL")
        ),
        "total_population": total_pop,
        "risk_distribution": risk_dist,
        "hazard_distribution": hazard_dist,
        "recent_alerts": alerts,
        "top_priority_habitations": priority_list[:10],
    })
