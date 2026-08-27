from pydantic import BaseModel
from typing import Any, Optional, List, Dict


class BaseResponse(BaseModel):
    success: bool = True
    data: Any = None
    message: str = "OK"
    demo_disclaimer: str = "Demonstration data only. Not for operational use."

    class Config:
        arbitrary_types_allowed = True


class LoginRequest(BaseModel):
    username: str
    password: str


class SimulationParams(BaseModel):
    habitation_id: int
    parameters: Dict[str, float] = {}


class AnalyzeRiskRequest(BaseModel):
    habitation_id: int
    weights: Optional[Dict[str, float]] = None


class ReportRequest(BaseModel):
    habitation_id: Optional[int] = None
    region: Optional[str] = None
    report_type: str = "full"
