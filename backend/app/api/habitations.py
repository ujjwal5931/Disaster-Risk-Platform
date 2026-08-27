from fastapi import APIRouter, Query
from typing import Optional
from app.models.schemas import BaseResponse
from app.database import execute_query, execute_one
from app.services.risk_engine import calculate_risk
from app.services.capacity_engine import calculate_capacity
from app.services.relocation_engine import calculate_relocation_priority, rank_safe_zones

router = APIRouter()


def _enrich(h: dict) -> dict:
    risk = calculate_risk(h)
    cap = calculate_capacity(h)
    safe_zones = execute_query("SELECT * FROM safe_zones")
    rel = calculate_relocation_priority(h, risk, cap)
    ranked_zones = rank_safe_zones(h, safe_zones, rel["priority"])
    vuln_total = (
        int(h.get("children_count", 0)) +
        int(h.get("elderly_count", 0)) +
        int(h.get("disabled_count", 0)) +
        int(h.get("pregnant_women_count", 0))
    )
    pop = max(int(h.get("population", 1)), 1)
    recommended_actions = _build_recommendations(h, risk, cap, rel)
    return {
        **h,
        "risk_assessment": risk,
        "capacity_assessment": cap,
        "relocation": {**rel, "recommended_safe_zones": ranked_zones},
        "vulnerable_total": vuln_total,
        "vulnerable_pct": round(vuln_total / pop * 100, 1),
        "recommended_actions": recommended_actions,
    }


def _build_recommendations(h, risk, cap, rel):
    actions = []
    pop = int(h.get("population", 0))
    rc = risk["risk_class"]
    priority = rel["priority"]
    cap_status = cap["overall_status"]

    if priority == "P1-IMMEDIATE":
        actions.append(f"Initiate immediate evacuation assessment for {pop:,} residents.")
    elif priority == "P2-URGENT":
        actions.append(f"Begin evacuation planning for {pop:,} residents within 72 hours.")

    if cap["dimensions"]["shelter"]["utilization"] > 100:
        deficit = int(pop - cap["dimensions"]["shelter"]["available"])
        actions.append(f"Increase emergency shelter capacity by minimum {deficit:,} persons.")

    if cap["dimensions"]["healthcare"]["utilization"] > 100:
        actions.append("Deploy additional mobile medical units and pre-position emergency medicines.")

    road = int(h.get("road_accessibility", 3))
    if road <= 2:
        actions.append("Inspect and reinforce primary evacuation road. Identify alternate routes.")

    if int(h.get("historical_event_count", 0)) >= 5:
        actions.append(f"Activate enhanced monitoring — {h.get('historical_event_count')} past events recorded.")

    if h.get("hazard_type") == "flood":
        actions.append("Monitor river gauge levels at 6-hour intervals. Alert downstream authorities.")
    elif h.get("hazard_type") == "landslide":
        actions.append("Establish continuous slope monitoring. Avoid construction on unstable slopes.")
    elif h.get("hazard_type") == "cyclone":
        actions.append("Coordinate with IMD for early warning. Pre-position coast guard resources.")

    if cap["dimensions"]["water"]["utilization"] > 100:
        actions.append("Deploy emergency water tankers. Establish water rationing protocol.")

    if rel["recommended_safe_zones"]:
        sz = rel["recommended_safe_zones"][0]
        actions.append(
            f"Evaluate relocation of vulnerable population to {sz['name']} "
            f"({sz['distance_km']} km away, capacity {sz['available_capacity']:,})."
        )

    return actions[:8]  # cap at 8 recommendations


@router.get("/", response_model=BaseResponse)
def get_habitations(
    hazard_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    district: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = Query(default=100, le=200),
    offset: int = Query(default=0, ge=0),
):
    query = "SELECT * FROM habitations WHERE 1=1"
    params = []
    if hazard_type and hazard_type != "all":
        query += " AND hazard_type = ?"
        params.append(hazard_type)
    if district and district != "all":
        query += " AND district LIKE ?"
        params.append(f"%{district}%")
    query += f" LIMIT {limit} OFFSET {offset}"

    habs = execute_query(query, tuple(params))
    results = []
    for h in habs:
        risk = calculate_risk(h)
        cap = calculate_capacity(h)
        rel = calculate_relocation_priority(h, risk, cap)
        if risk_level and risk_level != "all" and risk["risk_class"].lower() != risk_level.lower():
            continue
        if priority and priority != "all" and rel["priority"] != priority:
            continue
        results.append({
            **h,
            "risk_score": risk["risk_score"],
            "risk_class": risk["risk_class"],
            "capacity_utilization": cap["overall_utilization"],
            "capacity_status": cap["overall_status"],
            "relocation_priority": rel["priority"],
            "vulnerable_pct": round(
                (int(h.get("children_count", 0)) + int(h.get("elderly_count", 0)) +
                 int(h.get("disabled_count", 0)) + int(h.get("pregnant_women_count", 0)))
                / max(int(h.get("population", 1)), 1) * 100, 1
            ),
        })

    return BaseResponse(data={"items": results, "total": len(results)})


@router.get("/map-data", response_model=BaseResponse)
def get_map_data():
    """Lightweight endpoint for map marker rendering."""
    habs = execute_query("SELECT * FROM habitations")
    results = []
    for h in habs:
        risk = calculate_risk(h)
        cap = calculate_capacity(h)
        rel = calculate_relocation_priority(h, risk, cap)
        results.append({
            "id": h["id"],
            "name": h["name"],
            "district": h["district"],
            "state": h["state"],
            "latitude": h["latitude"],
            "longitude": h["longitude"],
            "population": h["population"],
            "hazard_type": h["hazard_type"],
            "risk_score": risk["risk_score"],
            "risk_class": risk["risk_class"],
            "capacity_utilization": cap["overall_utilization"],
            "capacity_status": cap["overall_status"],
            "relocation_priority": rel["priority"],
        })
    return BaseResponse(data=results)


@router.get("/{hab_id}", response_model=BaseResponse)
def get_habitation(hab_id: int):
    h = execute_one("SELECT * FROM habitations WHERE id = ?", (hab_id,))
    if not h:
        return BaseResponse(success=False, message=f"Habitation {hab_id} not found")
    return BaseResponse(data=_enrich(h))
