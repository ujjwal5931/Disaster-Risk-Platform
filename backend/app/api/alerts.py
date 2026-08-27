from fastapi import APIRouter
from app.models.schemas import BaseResponse
from app.database import execute_query, execute_write

router = APIRouter()


@router.get("/", response_model=BaseResponse)
def get_alerts():
    alerts = execute_query(
        "SELECT * FROM alerts ORDER BY "
        "CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'WARNING' THEN 3 ELSE 4 END, "
        "timestamp DESC"
    )
    return BaseResponse(data=alerts)


@router.post("/{alert_id}/acknowledge", response_model=BaseResponse)
def acknowledge_alert(alert_id: int):
    execute_write("UPDATE alerts SET acknowledged = 1 WHERE id = ?", (alert_id,))
    return BaseResponse(message=f"Alert {alert_id} acknowledged")
