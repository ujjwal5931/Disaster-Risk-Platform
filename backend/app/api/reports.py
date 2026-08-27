import datetime
from fastapi import APIRouter
from app.models.schemas import BaseResponse, ReportRequest
from app.database import execute_one, execute_query
from app.services.risk_engine import calculate_risk
from app.services.capacity_engine import calculate_capacity
from app.services.relocation_engine import calculate_relocation_priority, rank_safe_zones

router = APIRouter()


@router.post("/", response_model=BaseResponse)
def generate_report(req: ReportRequest):
    generated_at = datetime.datetime.now().isoformat()

    if req.habitation_id:
        h = execute_one("SELECT * FROM habitations WHERE id = ?", (req.habitation_id,))
        if not h:
            return BaseResponse(success=False, message="Habitation not found")

        risk = calculate_risk(h)
        cap = calculate_capacity(h)
        rel = calculate_relocation_priority(h, risk, cap)
        safe_zones = execute_query("SELECT * FROM safe_zones")
        ranked = rank_safe_zones(h, safe_zones, rel["priority"])
        pop = int(h.get("population", 0))
        vuln = (int(h.get("children_count", 0)) + int(h.get("elderly_count", 0)) +
                int(h.get("disabled_count", 0)) + int(h.get("pregnant_women_count", 0)))

        return BaseResponse(data={
            "report_type": "habitation",
            "generated_at": generated_at,
            "habitation": h,
            "executive_summary": {
                "name": h["name"],
                "district": h["district"],
                "state": h["state"],
                "population": pop,
                "risk_score": risk["risk_score"],
                "risk_class": risk["risk_class"],
                "capacity_utilization": cap["overall_utilization"],
                "capacity_status": cap["overall_status"],
                "relocation_priority": rel["priority"],
                "vulnerable_population": vuln,
                "vulnerable_pct": round(vuln / max(pop, 1) * 100, 1),
            },
            "risk_assessment": risk,
            "capacity_assessment": cap,
            "relocation_assessment": {**rel, "recommended_safe_zones": ranked[:3]},
            "methodology": (
                "This report uses a weighted rule-based risk scoring model combining 7 factors: "
                "hazard severity (25%), exposure (20%), population vulnerability (15%), "
                "infrastructure vulnerability (15%), historical frequency (10%), "
                "emergency accessibility (10%), and environmental sensitivity (5%). "
                "Carrying capacity is assessed across 7 dimensions. "
                "This is a prototype model — results must be validated against field data."
            ),
            "disclaimer": "Demonstration data only. Not for operational deployment.",
        })

    # Region-wide report
    habs = execute_query("SELECT * FROM habitations")
    redzones = execute_query("SELECT * FROM red_zones")
    critical_habs = []
    for h in habs:
        risk = calculate_risk(h)
        cap = calculate_capacity(h)
        if risk["risk_class"] in ("HIGH", "CRITICAL"):
            rel = calculate_relocation_priority(h, risk, cap)
            critical_habs.append({
                "id": h["id"], "name": h["name"], "district": h["district"],
                "population": h["population"], "risk_score": risk["risk_score"],
                "risk_class": risk["risk_class"], "priority": rel["priority"],
            })

    return BaseResponse(data={
        "report_type": "regional",
        "generated_at": generated_at,
        "total_habitations": len(habs),
        "critical_habitations": sorted(critical_habs, key=lambda x: x["risk_score"], reverse=True),
        "red_zones_count": len(redzones),
        "methodology": "Weighted rule-based risk model. Demonstration data only.",
        "disclaimer": "Demonstration data only. Not for operational deployment.",
    })
