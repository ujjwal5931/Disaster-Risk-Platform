import json
from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_query

router = APIRouter()


@router.get("/", response_model=BaseResponse)
def get_red_zones():
    rows = execute_query("SELECT * FROM red_zones ORDER BY risk_score DESC")
    results = []
    for r in rows:
        try:
            polygon = json.loads(r["polygon_coords"]) if r.get("polygon_coords") else []
        except Exception:
            polygon = []
        results.append({
            **r,
            "polygon": polygon,
        })
    return BaseResponse(data=results)


@router.get("/{zone_id}", response_model=BaseResponse)
def get_red_zone(zone_id: str):
    rows = execute_query("SELECT * FROM red_zones WHERE zone_id = ?", (zone_id,))
    if not rows:
        return BaseResponse(success=False, message="Red zone not found")
    r = rows[0]
    try:
        polygon = json.loads(r["polygon_coords"]) if r.get("polygon_coords") else []
    except Exception:
        polygon = []
    return BaseResponse(data={**r, "polygon": polygon})
