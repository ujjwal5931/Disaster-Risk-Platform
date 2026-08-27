from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_query

router = APIRouter()


@router.get("/", response_model=BaseResponse)
def get_hazard_events():
    events = execute_query("SELECT * FROM hazard_events ORDER BY year DESC")
    return BaseResponse(data=events)
