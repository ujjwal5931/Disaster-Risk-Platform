from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_one, execute_query
from app.services.risk_engine import calculate_risk
from app.services.capacity_engine import calculate_capacity
from app.services.relocation_engine import calculate_relocation_priority, rank_safe_zones

router = APIRouter()


@router.get("/", response_model=BaseResponse)
def get_all_relocation():
    """Returns prioritized relocation list for all habitations."""
    habs = execute_query("SELECT * FROM habitations")
    results = []
    for h in habs:
        risk = calculate_risk(h)
        cap = calculate_capacity(h)
        rel = calculate_relocation_priority(h, risk, cap)
        safe_zones = execute_query("SELECT * FROM safe_zones")
        ranked = rank_safe_zones(h, safe_zones, rel["priority"])
        results.append({
            "id": h["id"],
            "name": h["name"],
            "district": h["district"],
            "state": h["state"],
            "population": h["population"],
            "risk_score": risk["risk_score"],
            "risk_class": risk["risk_class"],
            "capacity_utilization": cap["overall_utilization"],
            "priority": rel["priority"],
            "priority_score": rel["priority_score"],
            "top_safe_zone": ranked[0] if ranked else None,
        })
    results.sort(key=lambda x: x["priority_score"], reverse=True)
    return BaseResponse(data=results)


@router.get("/{hab_id}", response_model=BaseResponse)
def get_relocation(hab_id: int):
    h = execute_one("SELECT * FROM habitations WHERE id = ?", (hab_id,))
    if not h:
        return BaseResponse(success=False, message="Habitation not found")
    risk = calculate_risk(h)
    cap = calculate_capacity(h)
    rel = calculate_relocation_priority(h, risk, cap)
    safe_zones = execute_query("SELECT * FROM safe_zones")
    ranked = rank_safe_zones(h, safe_zones, rel["priority"])
    return BaseResponse(data={
        **rel,
        "habitation_id": hab_id,
        "habitation_name": h["name"],
        "population": h["population"],
        "recommended_safe_zones": ranked,
    })


@router.post("/recommend", response_model=BaseResponse)
def recommend_relocation(body: dict):
    hab_id = body.get("habitation_id")
    if not hab_id:
        return BaseResponse(success=False, message="habitation_id required")
    h = execute_one("SELECT * FROM habitations WHERE id = ?", (hab_id,))
    if not h:
        return BaseResponse(success=False, message="Habitation not found")
    risk = calculate_risk(h)
    cap = calculate_capacity(h)
    rel = calculate_relocation_priority(h, risk, cap)
    safe_zones = execute_query("SELECT * FROM safe_zones")
    ranked = rank_safe_zones(h, safe_zones, rel["priority"])
    return BaseResponse(data={"priority": rel["priority"], "recommended_safe_zones": ranked})
