from fastapi import APIRouter
from app.models.schemas import BaseResponse, AnalyzeRiskRequest
from app.database import execute_query, execute_one
from app.services.risk_engine import calculate_risk

router = APIRouter()


@router.get("/risk-map", response_model=BaseResponse)
def get_risk_map():
    """Returns all habitations with computed risk for map rendering."""
    habs = execute_query("SELECT * FROM habitations")
    results = []
    for h in habs:
        risk = calculate_risk(h)
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
        })
    return BaseResponse(data=results)


@router.post("/analyze-risk", response_model=BaseResponse)
def analyze_risk(req: AnalyzeRiskRequest):
    h = execute_one("SELECT * FROM habitations WHERE id = ?", (req.habitation_id,))
    if not h:
        return BaseResponse(success=False, message="Habitation not found")
    result = calculate_risk(h, weights=req.weights)
    return BaseResponse(data=result, message="Risk analysis complete")
