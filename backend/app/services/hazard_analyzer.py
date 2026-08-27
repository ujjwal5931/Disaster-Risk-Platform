from typing import Dict, Any, List

def analyze_multi_hazard(habitation: Dict[str, Any]) -> Dict[str, Any]:
    htype = habitation.get("hazard_type", "unknown")
    sev = float(habitation.get("hazard_severity", 0))
    return {
        "primary_hazard": htype,
        "combined_severity": sev,
        "cascading_risks": ["infrastructure_damage"] if sev > 0.5 else []
    }
