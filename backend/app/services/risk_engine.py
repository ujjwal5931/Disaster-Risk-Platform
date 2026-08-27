from typing import Dict, Any, List

# Default risk weights — configurable
DEFAULT_WEIGHTS = {
    'hazard_severity': 0.25,
    'exposure': 0.20,
    'population_vulnerability': 0.15,
    'infrastructure_vulnerability': 0.15,
    'historical_frequency': 0.10,
    'emergency_accessibility': 0.10,
    'environmental_sensitivity': 0.05,
}

FACTOR_LABELS = {
    'hazard_severity': 'Hazard Severity',
    'exposure': 'Population Exposure',
    'population_vulnerability': 'Vulnerable Population',
    'infrastructure_vulnerability': 'Infrastructure Weakness',
    'historical_frequency': 'Historical Frequency',
    'emergency_accessibility': 'Emergency Accessibility',
    'environmental_sensitivity': 'Environmental Sensitivity',
}

FACTOR_DESCRIPTIONS = {
    'hazard_severity': "Intensity of the primary hazard (flood, landslide, cyclone, etc.) affecting the habitation.",
    'exposure': "Proportion of population directly exposed to hazard based on proximity and density.",
    'population_vulnerability': "Percentage of population with special vulnerability: children, elderly, disabled, pregnant women, BPL households.",
    'infrastructure_vulnerability': "Quality of permanent housing and built infrastructure; weaker housing = higher risk.",
    'historical_frequency': "Number and recency of past disaster events at or near this habitation.",
    'emergency_accessibility': "Road accessibility for emergency vehicles and evacuation; poor road = higher risk.",
    'environmental_sensitivity': "Slope gradient, soil type, and land characteristics amplifying hazard risk.",
}


def calculate_risk(habitation: Dict[str, Any], weights: Dict[str, float] = None) -> Dict[str, Any]:
    """
    Transparent explainable risk scoring engine.
    Returns risk_score (0–100), risk_class, contributing_factors, and human explanation.
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS

    h = habitation
    pop = max(float(h.get("population", 1)), 1)

    # 1. Hazard Severity (0–100)
    hazard_score = float(h.get("hazard_severity", 0)) * 100.0
    dist_km = float(h.get("distance_from_hazard_km", 50))
    distance_penalty = max(0, 1.0 - dist_km / 20.0)
    hazard_score = min(hazard_score * (0.6 + 0.4 * distance_penalty), 100.0)

    # 2. Population Exposure (0–100): based on population size
    exposure_score = min((pop / 10000.0) * 100.0, 100.0)
    if h.get("hazard_type") == "none":
        exposure_score *= 0.1

    # 3. Population Vulnerability (0–100)
    vuln_count = (
        int(h.get("children_count", 0)) +
        int(h.get("elderly_count", 0)) +
        int(h.get("disabled_count", 0)) +
        int(h.get("pregnant_women_count", 0))
    )
    bpl = int(h.get("below_poverty_count", 0))
    vuln_score = min(((vuln_count / pop) * 100.0) * 1.5, 100.0)
    vuln_score = min(vuln_score + (bpl / pop) * 30.0, 100.0)

    # 4. Infrastructure Vulnerability (0–100): inverse of housing quality (1–5)
    housing = max(1, min(5, int(h.get("housing_quality", 3))))
    infra_score = (6 - housing) * 20.0

    # 5. Historical Frequency (0–100)
    hist = int(h.get("historical_event_count", 0))
    hist_score = min(hist * 12.0, 100.0)
    last_year = int(h.get("last_event_year", 2000))
    recency_bonus = max(0, (last_year - 2015) * 3.0)
    hist_score = min(hist_score + recency_bonus, 100.0)

    # 6. Emergency Accessibility (0–100): inverse of road accessibility
    road = max(1, min(5, int(h.get("road_accessibility", 3))))
    evac = max(1, min(5, int(h.get("evacuation_route_quality", 3))))
    access_score = ((6 - road) + (6 - evac)) * 10.0

    # 7. Environmental Sensitivity (0–100): slope + rainfall in hazard areas
    slope = float(h.get("slope_degrees", 0))
    slope_score = min((slope / 45.0) * 100.0, 100.0)
    rainfall = float(h.get("rainfall_annual_mm", 800))
    rain_bonus = min((rainfall / 2000.0) * 30.0, 30.0)
    env_score = min(slope_score * 0.7 + rain_bonus, 100.0)
    if h.get("hazard_type") == "drought":
        env_score = min((1 - (rainfall / 1200.0)) * 100.0, 100.0)

    raw_scores = {
        'hazard_severity': hazard_score,
        'exposure': exposure_score,
        'population_vulnerability': vuln_score,
        'infrastructure_vulnerability': infra_score,
        'historical_frequency': hist_score,
        'emergency_accessibility': access_score,
        'environmental_sensitivity': env_score,
    }

    risk_score = 0.0
    contributing_factors = []
    for factor, score in raw_scores.items():
        w = weights.get(factor, DEFAULT_WEIGHTS[factor])
        contribution = round(score * w, 2)
        risk_score += contribution
        contributing_factors.append({
            "factor": factor,
            "label": FACTOR_LABELS[factor],
            "score": round(score, 1),
            "weight": round(w * 100),
            "contribution": contribution,
            "description": FACTOR_DESCRIPTIONS[factor],
        })

    risk_score = round(min(risk_score, 100.0), 1)
    contributing_factors.sort(key=lambda x: x["contribution"], reverse=True)

    if risk_score < 25:
        risk_class = "LOW"
    elif risk_score < 50:
        risk_class = "MODERATE"
    elif risk_score < 75:
        risk_class = "HIGH"
    else:
        risk_class = "CRITICAL"

    # Human-readable explanation
    top_factors = [f["label"].lower() for f in contributing_factors[:3]]
    top_str = ", ".join(top_factors[:-1]) + " and " + top_factors[-1] if len(top_factors) > 1 else top_factors[0]
    explanation = (
        f"This habitation is classified as {risk_class} risk (score: {risk_score}/100). "
        f"The primary drivers are {top_str}. "
    )
    if risk_class == "CRITICAL":
        explanation += "Immediate action is required to protect the resident population."
    elif risk_class == "HIGH":
        explanation += "Significant intervention is needed to reduce risk."
    elif risk_class == "MODERATE":
        explanation += "Monitoring and preparedness measures should be maintained."
    else:
        explanation += "Standard monitoring protocols are sufficient."

    # Data quality
    data_fields = ["population", "housing_quality", "road_accessibility", "hazard_severity",
                   "historical_event_count", "shelter_capacity_persons", "healthcare_beds"]
    filled = sum(1 for f in data_fields if h.get(f) is not None)
    if filled >= 6:
        data_quality = "HIGH"
        confidence = "HIGH"
    elif filled >= 4:
        data_quality = "MEDIUM"
        confidence = "MEDIUM"
    else:
        data_quality = "LOW"
        confidence = "LOW"

    return {
        "risk_score": risk_score,
        "risk_class": risk_class,
        "contributing_factors": contributing_factors,
        "explanation": explanation,
        "confidence": confidence,
        "data_quality": data_quality,
        "model_type": "Rule-based prototype model",
        "disclaimer": "Demonstration data only. Not for operational use.",
    }
