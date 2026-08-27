from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_query

router = APIRouter()


@router.get("/", response_model=BaseResponse)
def get_safe_zones():
    zones = execute_query("SELECT * FROM safe_zones ORDER BY safety_score DESC")
    return BaseResponse(data=zones)


@router.get("/{zone_id}", response_model=BaseResponse)
def get_safe_zone(zone_id: str):
    rows = execute_query("SELECT * FROM safe_zones WHERE zone_id = ?", (zone_id,))
    if not rows:
        return BaseResponse(success=False, message="Safe zone not found")
    return BaseResponse(data=rows[0])
