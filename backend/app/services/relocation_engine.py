import math
from typing import Dict, Any, List

PRIORITY_THRESHOLDS = {
    "P1-IMMEDIATE": 75,
    "P2-URGENT": 50,
    "P3-PLANNED": 25,
    "P4-MONITOR": 0,
}

PRIORITY_LABELS = {
    "P1-IMMEDIATE": "Immediate relocation required. Critical risk and unsafe capacity.",
    "P2-URGENT": "Urgent relocation planning required. High risk and significant capacity stress.",
    "P3-PLANNED": "Planned relocation warranted. Moderate/high risk, manageable in short term.",
    "P4-MONITOR": "Monitor situation. Low to moderate risk.",
}


def calculate_relocation_priority(
    habitation: Dict[str, Any],
    risk_result: Dict[str, Any],
    capacity_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Calculate relocation priority score from multiple risk and capacity signals.
    """
    h = habitation
    pop = max(int(h.get("population", 1)), 1)

    risk_score = float(risk_result.get("risk_score", 0))
    cap_util = float(capacity_result.get("overall_utilization", 100))

    # Vulnerable population fraction
    vuln = (
        int(h.get("children_count", 0)) +
        int(h.get("elderly_count", 0)) +
        int(h.get("disabled_count", 0)) +
        int(h.get("pregnant_women_count", 0))
    )
    vuln_pct = (vuln / pop) * 100

    # Distance from hazard (closer = more urgent)
    dist_km = float(h.get("distance_from_hazard_km", 20))
    hazard_proximity_score = max(0, (1 - dist_km / 20.0)) * 100

    # Evacuation difficulty (inverse of road + evac quality)
    road = max(1, min(5, int(h.get("road_accessibility", 3))))
    evac = max(1, min(5, int(h.get("evacuation_route_quality", 3))))
    evac_difficulty = ((10 - road - evac) / 8.0) * 100

    # Historical frequency bonus
    hist_score = min(int(h.get("historical_event_count", 0)) * 10, 100)

    # Combined weighted priority score
    priority_score = (
        risk_score * 0.30 +
        min(cap_util, 200) * 0.25 / 2 +  # normalize cap_util out of 200 → 100
        vuln_pct * 0.15 +
        hazard_proximity_score * 0.10 +
        evac_difficulty * 0.05 +
        hist_score * 0.05 +
        (100 - pop / 200) * 0.10  # large populations harder to relocate
    )
    priority_score = round(min(priority_score, 100), 1)

    # Classify priority
    if priority_score >= 75:
        priority = "P1-IMMEDIATE"
    elif priority_score >= 50:
        priority = "P2-URGENT"
    elif priority_score >= 25:
        priority = "P3-PLANNED"
    else:
        priority = "P4-MONITOR"

    return {
        "priority": priority,
        "priority_score": priority_score,
        "priority_label": PRIORITY_LABELS[priority],
        "factors": {
            "risk_score": round(risk_score, 1),
            "capacity_utilization": round(cap_util, 1),
            "vulnerable_population_pct": round(vuln_pct, 1),
            "hazard_proximity_score": round(hazard_proximity_score, 1),
            "evacuation_difficulty": round(evac_difficulty, 1),
            "historical_frequency_score": round(hist_score, 1),
        },
    }


def rank_safe_zones(
    habitation: Dict[str, Any],
    safe_zones: List[Dict[str, Any]],
    priority: str,
) -> List[Dict[str, Any]]:
    """
    Rank safe zones by suitability for a given habitation.
    Considers safety, capacity, distance, and accessibility.
    """
    hab_lat = float(habitation.get("latitude", 20))
    hab_lon = float(habitation.get("longitude", 80))
    pop = int(habitation.get("population", 1000))

    ranked = []
    for sz in safe_zones:
        sz_lat = float(sz.get("latitude", 20))
        sz_lon = float(sz.get("longitude", 80))
        distance_km = _haversine_km(hab_lat, hab_lon, sz_lat, sz_lon)

        cap = int(sz.get("available_capacity", 0))
        capacity_fit = "Sufficient" if cap >= pop else "Partial" if cap >= pop * 0.5 else "Insufficient"
        safety_score = float(sz.get("safety_score", 80))

        # Score components
        distance_score = max(0, (1 - distance_km / 300) * 100)  # max 300km
        capacity_score = min((cap / max(pop, 1)) * 100, 100)

        access_lookup = {"Excellent": 100, "Good": 75, "Fair": 50}
        road_s = access_lookup.get(sz.get("road_access", "Fair"), 50)
        health_s = access_lookup.get(sz.get("healthcare_access", "Fair"), 50)
        water_s = access_lookup.get(sz.get("water_availability", "Fair"), 50)

        suitability = (
            safety_score * 0.30 +
            distance_score * 0.25 +
            capacity_score * 0.20 +
            road_s * 0.10 +
            health_s * 0.10 +
            water_s * 0.05
        )

        travel_hours = max(0.5, distance_km / 40)  # assume 40 km/h average

        ranked.append({
            **sz,
            "distance_km": round(distance_km, 1),
            "distance_score": round(distance_score, 1),
            "capacity_fit": capacity_fit,
            "suitability_score": round(suitability, 1),
            "estimated_travel_hours": round(travel_hours, 1),
            "recommended": suitability >= 70 and cap >= pop * 0.3,
        })

    ranked.sort(key=lambda x: x["suitability_score"], reverse=True)
    return ranked[:5]  # return top 5


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))
