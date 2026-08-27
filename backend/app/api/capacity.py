from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_one, execute_query
from app.services.capacity_engine import calculate_capacity

router = APIRouter()


@router.get("/{hab_id}", response_model=BaseResponse)
def get_capacity(hab_id: int):
    h = execute_one("SELECT * FROM habitations WHERE id = ?", (hab_id,))
    if not h:
        return BaseResponse(success=False, message="Habitation not found")
    result = calculate_capacity(h)
    result["habitation_id"] = hab_id
    result["habitation_name"] = h["name"]
    result["population"] = h["population"]
    return BaseResponse(data=result)


@router.get("/", response_model=BaseResponse)
def get_all_capacity():
    """Returns capacity summary for all habitations."""
    habs = execute_query("SELECT * FROM habitations")
    results = []
    for h in habs:
        cap = calculate_capacity(h)
        results.append({
            "id": h["id"],
            "name": h["name"],
            "district": h["district"],
            "population": h["population"],
            "overall_utilization": cap["overall_utilization"],
            "overall_status": cap["overall_status"],
        })
    results.sort(key=lambda x: x["overall_utilization"], reverse=True)
    return BaseResponse(data=results)
