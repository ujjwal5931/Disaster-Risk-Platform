from typing import Dict, Any
from app.services.risk_engine import calculate_risk
from app.services.capacity_engine import calculate_capacity


def run_simulation(
    habitation: Dict[str, Any],
    params: Dict[str, Any],
) -> Dict[str, Any]:
    """
    What-if simulation: apply parameter perturbations and compare before/after.
    
    Supported parameters:
        population_change_pct    : -50 to +100 (% change in population)
        rainfall_multiplier      : 0.5 to 3.0  (multiply rainfall)
        flood_level              : 0 to 5      (increases hazard_severity)
        hazard_severity_delta    : -0.5 to +0.5 (direct delta to hazard_severity)
        shelter_capacity_change_pct: -50 to +100
        healthcare_capacity_change_pct: -50 to +100
        road_availability_pct    : 0 to 100   (% of road capacity available)
    """
    # BEFORE state
    before_risk = calculate_risk(habitation)
    before_cap = calculate_capacity(habitation)

    # Build modified habitation
    mod = dict(habitation)

    pop_change = float(params.get("population_change_pct", 0))
    mod["population"] = max(1, int(mod["population"] * (1 + pop_change / 100)))
    mod["children_count"] = int(mod.get("children_count", 0) * (1 + pop_change / 100))
    mod["elderly_count"] = int(mod.get("elderly_count", 0) * (1 + pop_change / 100))
    mod["disabled_count"] = int(mod.get("disabled_count", 0) * (1 + pop_change / 100))
    mod["pregnant_women_count"] = int(mod.get("pregnant_women_count", 0) * (1 + pop_change / 100))

    rainfall_mult = float(params.get("rainfall_multiplier", 1.0))
    mod["rainfall_annual_mm"] = float(mod.get("rainfall_annual_mm", 800)) * rainfall_mult

    flood_level = float(params.get("flood_level", 0))
    if flood_level > 0:
        mod["hazard_severity"] = min(1.0, float(mod.get("hazard_severity", 0)) + flood_level * 0.12)
        mod["distance_from_hazard_km"] = max(0.1, float(mod.get("distance_from_hazard_km", 2)) - flood_level * 0.3)

    haz_delta = float(params.get("hazard_severity_delta", 0))
    mod["hazard_severity"] = max(0.0, min(1.0, float(mod.get("hazard_severity", 0)) + haz_delta))

    shelter_change = float(params.get("shelter_capacity_change_pct", 0))
    mod["shelter_capacity_persons"] = max(1, int(mod.get("shelter_capacity_persons", 1) * (1 + shelter_change / 100)))

    health_change = float(params.get("healthcare_capacity_change_pct", 0))
    mod["healthcare_beds"] = max(1, int(mod.get("healthcare_beds", 1) * (1 + health_change / 100)))

    road_pct = float(params.get("road_availability_pct", 100))
    if road_pct < 100:
        road_factor = road_pct / 100.0
        mod["road_accessibility"] = max(1, round(float(mod.get("road_accessibility", 3)) * road_factor))
        mod["evacuation_route_quality"] = max(1, round(float(mod.get("evacuation_route_quality", 3)) * road_factor))

    # AFTER state
    after_risk = calculate_risk(mod)
    after_cap = calculate_capacity(mod)

    # Build delta summary
    risk_delta = round(after_risk["risk_score"] - before_risk["risk_score"], 1)
    cap_delta = round(after_cap["overall_utilization"] - before_cap["overall_utilization"], 1)

    # Risk class upgrade count (simulate "how many habitations would escalate")
    risk_class_order = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}
    class_change = risk_class_order[after_risk["risk_class"]] - risk_class_order[before_risk["risk_class"]]

    scenario_name = _build_scenario_name(params)

    return {
        "scenario": scenario_name,
        "parameters_applied": params,
        "before": {
            "risk_score": before_risk["risk_score"],
            "risk_class": before_risk["risk_class"],
            "capacity_utilization": before_cap["overall_utilization"],
            "capacity_status": before_cap["overall_status"],
            "population": int(habitation.get("population", 0)),
        },
        "after": {
            "risk_score": after_risk["risk_score"],
            "risk_class": after_risk["risk_class"],
            "capacity_utilization": after_cap["overall_utilization"],
            "capacity_status": after_cap["overall_status"],
            "population": mod["population"],
        },
        "deltas": {
            "risk_score_delta": risk_delta,
            "risk_class_change": class_change,
            "capacity_utilization_delta": cap_delta,
            "population_delta": mod["population"] - int(habitation.get("population", 0)),
        },
        "interpretation": _interpret_deltas(risk_delta, cap_delta, class_change),
        "contributing_factors_after": after_risk["contributing_factors"][:5],
        "disclaimer": "Simulation uses demonstration data only. Not for operational use.",
    }


def _build_scenario_name(params: Dict[str, Any]) -> str:
    parts = []
    if params.get("population_change_pct", 0) != 0:
        parts.append(f"{int(params['population_change_pct']):+d}% population change")
    if params.get("rainfall_multiplier", 1.0) != 1.0:
        parts.append(f"{params['rainfall_multiplier']:.1f}× rainfall intensity")
    if params.get("flood_level", 0) > 0:
        parts.append(f"Flood level {params['flood_level']:.0f}")
    if params.get("hazard_severity_delta", 0) != 0:
        parts.append(f"{params['hazard_severity_delta']:+.1f} hazard severity")
    if params.get("shelter_capacity_change_pct", 0) != 0:
        parts.append(f"{int(params['shelter_capacity_change_pct']):+d}% shelter capacity")
    if params.get("healthcare_capacity_change_pct", 0) != 0:
        parts.append(f"{int(params['healthcare_capacity_change_pct']):+d}% healthcare capacity")
    if params.get("road_availability_pct", 100) != 100:
        parts.append(f"{params['road_availability_pct']:.0f}% road availability")
    return ", ".join(parts) if parts else "Baseline scenario"


def _interpret_deltas(risk_delta: float, cap_delta: float, class_change: int) -> str:
    msgs = []
    if risk_delta >= 10:
        msgs.append(f"Risk score increases significantly by {risk_delta:+.1f} points.")
    elif risk_delta <= -10:
        msgs.append(f"Risk score improves by {abs(risk_delta):.1f} points.")
    elif risk_delta != 0:
        msgs.append(f"Risk score changes by {risk_delta:+.1f} points.")
    if class_change > 0:
        msgs.append(f"Risk classification escalates by {class_change} level(s).")
    elif class_change < 0:
        msgs.append(f"Risk classification improves by {abs(class_change)} level(s).")
    if cap_delta >= 20:
        msgs.append(f"Carrying capacity stress increases sharply by {cap_delta:+.1f}%.")
    elif cap_delta <= -20:
        msgs.append(f"Carrying capacity pressure reduces by {abs(cap_delta):.1f}%.")
    if not msgs:
        msgs.append("No significant change in risk or capacity status under these parameters.")
    return " ".join(msgs)
