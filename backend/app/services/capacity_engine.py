from typing import Dict, Any

# Capacity dimension labels and descriptions
DIMENSIONS = {
    "water": {
        "label": "Water Supply",
        "icon": "💧",
        "description": "Daily water availability vs minimum requirement (50L/person/day baseline, 80L under disaster).",
    },
    "shelter": {
        "label": "Emergency Shelter",
        "icon": "🏠",
        "description": "Available emergency shelter capacity relative to population requiring shelter during disaster.",
    },
    "healthcare": {
        "label": "Healthcare",
        "icon": "🏥",
        "description": "Emergency hospital beds available vs expected trauma and emergency demand (3% of population).",
    },
    "road_evacuation": {
        "label": "Road / Evacuation",
        "icon": "🛣️",
        "description": "Estimated evacuation route throughput vs population requiring evacuation.",
    },
    "food": {
        "label": "Food Stock",
        "icon": "🌾",
        "description": "Emergency food stock in days of supply vs minimum 7-day requirement.",
    },
    "sanitation": {
        "label": "Sanitation",
        "icon": "🚿",
        "description": "Sanitation facility coverage percentage; 80% is the minimum acceptable threshold.",
    },
    "safe_land": {
        "label": "Safe Land",
        "icon": "🗺️",
        "description": "Ratio of safe inhabitable land area to current population density requirement.",
    },
}


def _utilization_status(utilization: float) -> str:
    if utilization < 70:
        return "SAFE"
    elif utilization < 100:
        return "STRESSED"
    elif utilization < 120:
        return "OVERLOADED"
    else:
        return "CRITICAL"


def calculate_capacity(habitation: Dict[str, Any]) -> Dict[str, Any]:
    """
    7-dimension carrying capacity assessment.
    Returns utilization % for each dimension + overall status.
    """
    pop = max(int(habitation.get("population", 1)), 1)
    h = habitation

    # 1. Water: available / required (50L per person per day baseline for disaster)
    water_available = float(h.get("water_capacity_liters_per_day", pop * 30))
    water_required = pop * 50.0  # 50L/person/day disaster baseline
    water_util = round((water_required / max(water_available, 1)) * 100, 1)

    # 2. Shelter: emergency shelter needed is 25% of population (those displaced by hazard)
    shelter_cap = max(int(h.get("shelter_capacity_persons", int(pop * 0.3))), 1)
    shelter_needed = pop * 0.25  # 25% need emergency shelter during disaster
    shelter_util = round((shelter_needed / shelter_cap) * 100, 1)

    # 3. Healthcare: 1 critical emergency per 500 people is the realistic rural disaster demand
    expected_patients = pop / 500.0  # 0.2% emergency demand (rural India baseline)
    beds = max(int(h.get("healthcare_beds", 1)), 1)
    healthcare_util = round((expected_patients / beds) * 100, 1)


    # 4. Road/Evacuation: hours to evacuate vs 12-hour safe window
    road = max(1, min(5, int(h.get("road_accessibility", 3))))
    evac = max(1, min(5, int(h.get("evacuation_route_quality", 3))))
    evac_rate_per_hour = (road + evac) / 2 * 500  # persons/hour per route quality
    hours_to_evacuate = pop / max(evac_rate_per_hour, 1)
    # >12 hours = overloaded, 6-12 = stressed, <6 = safe
    road_util = round(min((hours_to_evacuate / 12.0) * 100, 200), 1)

    # 5. Food: 7-day target vs available stock
    food_days = float(h.get("food_stock_days", 7.0))
    food_util = round((7.0 / max(food_days, 0.1)) * 100, 1)

    # 6. Sanitation: 70% coverage is safe baseline
    sanitation_pct = float(h.get("sanitation_coverage_pct", 50.0))
    sanitation_util = round((70.0 / max(sanitation_pct, 1)) * 100, 1)

    # 7. Safe Land: 2000 persons/sqkm is safe density threshold
    safe_land = float(h.get("safe_land_area_sqkm", 1.0))
    safe_density = 2000.0  # persons per sqkm safe threshold
    safe_land_capacity = safe_land * safe_density
    safe_land_util = round((pop / max(safe_land_capacity, 1)) * 100, 1)

    dimensions = {
        "water": {"utilization": water_util, "status": _utilization_status(water_util),
                  "available": water_available, "required": water_required, **DIMENSIONS["water"]},
        "shelter": {"utilization": shelter_util, "status": _utilization_status(shelter_util),
                    "available": shelter_cap, "required": pop, **DIMENSIONS["shelter"]},
        "healthcare": {"utilization": healthcare_util, "status": _utilization_status(healthcare_util),
                       "available": beds, "required": round(expected_patients, 1), **DIMENSIONS["healthcare"]},
        "road_evacuation": {"utilization": road_util, "status": _utilization_status(road_util),
                            "available": round(evac_rate_per_hour * 12), "required": pop, **DIMENSIONS["road_evacuation"]},
        "food": {"utilization": food_util, "status": _utilization_status(food_util),
                 "available": food_days, "required": 7.0, **DIMENSIONS["food"]},
        "sanitation": {"utilization": sanitation_util, "status": _utilization_status(sanitation_util),
                       "available": sanitation_pct, "required": 80.0, **DIMENSIONS["sanitation"]},
        "safe_land": {"utilization": safe_land_util, "status": _utilization_status(safe_land_util),
                      "available": round(safe_land_capacity), "required": pop, **DIMENSIONS["safe_land"]},
    }

    utils = [d["utilization"] for d in dimensions.values()]
    overall_util = round(sum(utils) / len(utils), 1)
    overall_status = _utilization_status(overall_util)

    # Explanation
    critical_dims = [d["label"] for d in dimensions.values() if d["utilization"] >= 120]
    overloaded_dims = [d["label"] for d in dimensions.values() if 100 <= d["utilization"] < 120]

    if critical_dims:
        explanation = (
            f"Current population and disaster exposure significantly exceed safe service capacity. "
            f"Critical deficiencies in: {', '.join(critical_dims)}. "
            f"Immediate capacity augmentation is required."
        )
    elif overloaded_dims:
        explanation = (
            f"Service capacity is overloaded in {len(overloaded_dims)} dimension(s): "
            f"{', '.join(overloaded_dims)}. "
            f"Intervention required to prevent service failure during disaster."
        )
    elif overall_util >= 70:
        explanation = (
            f"Capacity is stressed but within manageable limits. "
            f"Pre-positioning of emergency resources is recommended."
        )
    else:
        explanation = (
            f"Overall carrying capacity is within safe limits. "
            f"Standard preparedness protocols are adequate."
        )

    return {
        "overall_utilization": overall_util,
        "overall_status": overall_status,
        "dimensions": dimensions,
        "explanation": explanation,
        "disclaimer": "Demonstration data only. Not for operational use.",
    }
