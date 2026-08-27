import json
from fastapi import APIRouter
from app.models.schemas import BaseResponse, SimulationParams
from app.database import execute_one, execute_write
from app.services.simulation_engine import run_simulation

router = APIRouter()


@router.post("/", response_model=BaseResponse)
def simulate(req: SimulationParams):
    h = execute_one("SELECT * FROM habitations WHERE id = ?", (req.habitation_id,))
    if not h:
        return BaseResponse(success=False, message="Habitation not found")
    result = run_simulation(h, req.parameters)
    execute_write(
        "INSERT INTO simulation_runs (habitation_id, parameters, result) VALUES (?, ?, ?)",
        (req.habitation_id, json.dumps(req.parameters), json.dumps(result))
    )
    return BaseResponse(data=result, message="Simulation complete")


@router.get("/presets", response_model=BaseResponse)
def get_presets():
    """Pre-defined simulation scenarios for demo."""
    return BaseResponse(data=[
        {
            "id": "rainfall_20",
            "name": "20% Rainfall Increase",
            "description": "Simulates a 20% increase in annual rainfall intensity.",
            "parameters": {"rainfall_multiplier": 1.2},
        },
        {
            "id": "major_flood",
            "name": "Major Flood Event",
            "description": "Simulates a major flood — elevated flood level and reduced road access.",
            "parameters": {"flood_level": 4, "road_availability_pct": 40},
        },
        {
            "id": "population_50",
            "name": "50% Population Growth",
            "description": "Simulates 50% population increase due to migration.",
            "parameters": {"population_change_pct": 50},
        },
        {
            "id": "shelter_increase",
            "name": "Double Shelter Capacity",
            "description": "Intervention scenario: 100% increase in emergency shelter capacity.",
            "parameters": {"shelter_capacity_change_pct": 100, "healthcare_capacity_change_pct": 50},
        },
        {
            "id": "worst_case",
            "name": "Worst Case Scenario",
            "description": "Combined stress: major flood + population growth + infrastructure damage.",
            "parameters": {
                "flood_level": 5,
                "population_change_pct": 20,
                "road_availability_pct": 30,
                "rainfall_multiplier": 2.0,
            },
        },
    ])
