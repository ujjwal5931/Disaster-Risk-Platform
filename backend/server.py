#!/usr/bin/env python3
"""
Disaster Risk Intelligence Platform — Backend API Server
Pure Python 3.14 compatible — NO external dependencies required.
Uses http.server + json for zero-dependency operation.

Run: python3 server.py
"""
import http.server
import json
import os
import sys
import re
import urllib.parse
import io
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from app.services.risk_engine import calculate_risk
from app.services.capacity_engine import calculate_capacity
from app.services.relocation_engine import calculate_relocation_priority, rank_safe_zones
from app.services.simulation_engine import run_simulation
from app.database import execute_query, execute_one, execute_write
from app.core.auth import verify_password, create_mock_token, decode_mock_token
import datetime, math, hashlib

DISCLAIMER = "Demonstration data only. Not for operational use."
PORT = 8000


def ok(data=None, message="OK"):
    return {"success": True, "data": data, "message": message, "demo_disclaimer": DISCLAIMER}


def err(message="Error", code=400):
    return {"success": False, "data": None, "message": message, "demo_disclaimer": DISCLAIMER}, code


def _enrich_hab(h):
    risk = calculate_risk(h)
    cap = calculate_capacity(h)
    safe_zones = execute_query("SELECT * FROM safe_zones")
    rel = calculate_relocation_priority(h, risk, cap)
    ranked = rank_safe_zones(h, safe_zones, rel["priority"])
    pop = max(int(h.get("population", 1)), 1)
    vuln = (int(h.get("children_count", 0)) + int(h.get("elderly_count", 0)) +
            int(h.get("disabled_count", 0)) + int(h.get("pregnant_women_count", 0)))
    return {
        **h,
        "risk_assessment": risk,
        "capacity_assessment": cap,
        "relocation": {**rel, "recommended_safe_zones": ranked},
        "vulnerable_total": vuln,
        "vulnerable_pct": round(vuln / pop * 100, 1),
    }


class DRIPSHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {format % args}")

    def send_json(self, data, status=200):
        body = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw)
        except Exception:
            return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        params = dict(urllib.parse.parse_qsl(parsed.query))

        routes = [
            (r"^/$", self.handle_root),
            (r"^/api$", self.handle_root),
            (r"^/api/dashboard$", self.handle_dashboard),
            (r"^/api/habitations$", self.handle_habitations),
            (r"^/api/habitations/map-data$", self.handle_map_data),
            (r"^/api/habitations/(\d+)$", self.handle_habitation_detail),
            (r"^/api/risk-map$", self.handle_risk_map),
            (r"^/api/red-zones$", self.handle_red_zones),
            (r"^/api/red-zones/([^/]+)$", self.handle_red_zone_detail),
            (r"^/api/safe-zones$", self.handle_safe_zones),
            (r"^/api/safe-zones/([^/]+)$", self.handle_safe_zone_detail),
            (r"^/api/capacity$", self.handle_capacity_all),
            (r"^/api/capacity/(\d+)$", self.handle_capacity),
            (r"^/api/relocation$", self.handle_relocation_all),
            (r"^/api/relocation/(\d+)$", self.handle_relocation),
            (r"^/api/alerts$", self.handle_alerts),
            (r"^/api/hazards$", self.handle_hazards),
            (r"^/api/simulate/presets$", self.handle_simulation_presets),
        ]

        for pattern, handler in routes:
            m = re.match(pattern, path)
            if m:
                groups = m.groups()
                handler(*groups, params=params)
                return

        self.send_json(err("Not found", 404)[0], 404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        post_routes = [
            (r"^/api/auth/login$", self.handle_login),
            (r"^/api/analyze-risk$", self.handle_analyze_risk),
            (r"^/api/simulate$", self.handle_simulate),
            (r"^/api/relocation/recommend$", self.handle_relocation_recommend),
            (r"^/api/reports$", self.handle_reports),
            (r"^/api/habitations/replace-all$", self.handle_replace_all_habitations),
            (r"^/api/upload-data$", self.handle_upload),
        ]

        for pattern, handler in post_routes:
            if re.match(pattern, path):
                body = self.read_json_body()
                handler(body)
                return

        self.send_json(err("Not found", 404)[0], 404)

    # ── GET Handlers ──────────────────────────────────────────────────────────

    def handle_root(self, *_, params=None):
        self.send_json({"name": "Disaster Risk Intelligence Platform API",
                        "version": "1.0.0-demo", "status": "running",
                        "disclaimer": DISCLAIMER, "docs": "See README.md"})

    def handle_dashboard(self, *_, params=None):
        habs = execute_query("SELECT * FROM habitations")
        alerts = execute_query(
            "SELECT * FROM alerts ORDER BY "
            "CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'WARNING' THEN 3 ELSE 4 END LIMIT 5"
        )
        total_pop = high_risk = critical = cap_exceeded = immediate = 0
        risk_dist = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "CRITICAL": 0}
        hazard_dist: dict = {}
        priority_list = []

        for h in habs:
            risk = calculate_risk(h)
            cap = calculate_capacity(h)
            pop = int(h.get("population", 0))
            total_pop += pop
            rc = risk["risk_class"]
            risk_dist[rc] = risk_dist.get(rc, 0) + 1
            htype = str(h.get("hazard_type", "none"))
            htype_label = {"none": "None", "multi": "Multi-Hazard", "industrial": "Industrial",
                           "flood": "Flood", "landslide": "Landslide", "cyclone": "Cyclone",
                           "drought": "Drought", "earthquake": "Earthquake", "wildfire": "Wildfire"}.get(htype, htype.title())
            hazard_dist[htype_label] = hazard_dist.get(htype_label, 0) + 1
            if rc == "HIGH":
                high_risk += 1
            elif rc == "CRITICAL":
                critical += 1
            if cap["overall_utilization"] > 100:
                cap_exceeded += 1
            rel = calculate_relocation_priority(h, risk, cap)
            if rel["priority"] == "P1-IMMEDIATE":
                immediate += 1
            priority_list.append({
                "id": h["id"], "name": h["name"], "district": h["district"],
                "state": h["state"], "population": pop,
                "risk_score": risk["risk_score"], "risk_class": rc,
                "hazard_type": h.get("hazard_type"),
                "capacity_utilization": cap["overall_utilization"],
                "capacity_status": cap["overall_status"],
                "relocation_priority": rel["priority"],
            })

        priority_list.sort(key=lambda x: x["risk_score"], reverse=True)
        at_risk_pop = sum(h["population"] for h in priority_list if h["risk_class"] in ("HIGH", "CRITICAL"))

        self.send_json(ok({
            "total_habitations": len(habs), "high_risk_count": high_risk,
            "critical_count": critical, "capacity_exceeded_count": cap_exceeded,
            "immediate_relocation_count": immediate, "population_at_risk": at_risk_pop,
            "total_population": total_pop, "risk_distribution": risk_dist,
            "hazard_distribution": hazard_dist, "recent_alerts": alerts,
            "top_priority_habitations": priority_list[:10],
        }))

    def handle_habitations(self, *_, params=None):
        params = params or {}
        haz = params.get("hazard_type")
        district = params.get("district")
        risk_level = params.get("risk_level")
        priority = params.get("priority")
        limit = min(int(params.get("limit", 100)), 200)
        offset = int(params.get("offset", 0))

        query = "SELECT * FROM habitations WHERE 1=1"
        args = []
        if haz and haz != "all":
            query += " AND hazard_type = ?"
            args.append(haz)
        if district and district != "all":
            query += " AND district LIKE ?"
            args.append(f"%{district}%")
        query += f" LIMIT {limit} OFFSET {offset}"

        habs = execute_query(query, tuple(args))
        results = []
        for h in habs:
            risk = calculate_risk(h)
            cap = calculate_capacity(h)
            rel = calculate_relocation_priority(h, risk, cap)
            if risk_level and risk_level != "all" and risk["risk_class"].lower() != risk_level.lower():
                continue
            if priority and priority != "all" and rel["priority"] != priority:
                continue
            pop = max(int(h.get("population", 1)), 1)
            vuln = int(h.get("children_count", 0)) + int(h.get("elderly_count", 0))
            results.append({
                **h, "risk_score": risk["risk_score"], "risk_class": risk["risk_class"],
                "capacity_utilization": cap["overall_utilization"],
                "capacity_status": cap["overall_status"],
                "relocation_priority": rel["priority"],
                "vulnerable_pct": round(vuln / pop * 100, 1),
            })

        self.send_json(ok({"items": results, "total": len(results)}))

    def handle_map_data(self, *_, params=None):
        habs = execute_query("SELECT * FROM habitations")
        results = []
        for h in habs:
            risk = calculate_risk(h)
            cap = calculate_capacity(h)
            rel = calculate_relocation_priority(h, risk, cap)
            results.append({
                "id": h["id"], "name": h["name"], "district": h["district"],
                "state": h["state"], "latitude": h["latitude"], "longitude": h["longitude"],
                "population": h["population"], "hazard_type": h["hazard_type"],
                "risk_score": risk["risk_score"], "risk_class": risk["risk_class"],
                "capacity_utilization": cap["overall_utilization"],
                "capacity_status": cap["overall_status"],
                "relocation_priority": rel["priority"],
            })
        self.send_json(ok(results))

    def handle_habitation_detail(self, hab_id, *_, params=None):
        h = execute_one("SELECT * FROM habitations WHERE id = ?", (int(hab_id),))
        if not h:
            self.send_json(err("Habitation not found", 404)[0], 404)
            return
        self.send_json(ok(_enrich_hab(h)))

    def handle_risk_map(self, *_, params=None):
        habs = execute_query("SELECT * FROM habitations")
        results = []
        for h in habs:
            risk = calculate_risk(h)
            results.append({
                "id": h["id"], "name": h["name"], "district": h["district"],
                "latitude": h["latitude"], "longitude": h["longitude"],
                "population": h["population"], "hazard_type": h["hazard_type"],
                "risk_score": risk["risk_score"], "risk_class": risk["risk_class"],
            })
        self.send_json(ok(results))

    def handle_red_zones(self, *_, params=None):
        rows = execute_query("SELECT * FROM red_zones ORDER BY risk_score DESC")
        results = []
        for r in rows:
            try:
                polygon = json.loads(r.get("polygon_coords", "[]"))
            except Exception:
                polygon = []
            results.append({**r, "polygon": polygon})
        self.send_json(ok(results))

    def handle_red_zone_detail(self, zone_id, *_, params=None):
        rows = execute_query("SELECT * FROM red_zones WHERE zone_id = ?", (zone_id,))
        if not rows:
            self.send_json(err("Not found", 404)[0], 404)
            return
        r = rows[0]
        try:
            polygon = json.loads(r.get("polygon_coords", "[]"))
        except Exception:
            polygon = []
        self.send_json(ok({**r, "polygon": polygon}))

    def handle_safe_zones(self, *_, params=None):
        zones = execute_query("SELECT * FROM safe_zones ORDER BY safety_score DESC")
        self.send_json(ok(zones))

    def handle_safe_zone_detail(self, zone_id, *_, params=None):
        rows = execute_query("SELECT * FROM safe_zones WHERE zone_id = ?", (zone_id,))
        if not rows:
            self.send_json(err("Not found", 404)[0], 404)
            return
        self.send_json(ok(rows[0]))

    def handle_capacity(self, hab_id, *_, params=None):
        h = execute_one("SELECT * FROM habitations WHERE id = ?", (int(hab_id),))
        if not h:
            self.send_json(err("Not found", 404)[0], 404)
            return
        cap = calculate_capacity(h)
        cap["habitation_id"] = int(hab_id)
        cap["habitation_name"] = h["name"]
        cap["population"] = h["population"]
        self.send_json(ok(cap))

    def handle_capacity_all(self, *_, params=None):
        habs = execute_query("SELECT * FROM habitations")
        results = []
        for h in habs:
            cap = calculate_capacity(h)
            results.append({
                "id": h["id"], "name": h["name"], "district": h["district"],
                "population": h["population"],
                "overall_utilization": cap["overall_utilization"],
                "overall_status": cap["overall_status"],
            })
        results.sort(key=lambda x: x["overall_utilization"], reverse=True)
        self.send_json(ok(results))

    def handle_relocation(self, hab_id, *_, params=None):
        h = execute_one("SELECT * FROM habitations WHERE id = ?", (int(hab_id),))
        if not h:
            self.send_json(err("Not found", 404)[0], 404)
            return
        risk = calculate_risk(h)
        cap = calculate_capacity(h)
        rel = calculate_relocation_priority(h, risk, cap)
        safe_zones = execute_query("SELECT * FROM safe_zones")
        ranked = rank_safe_zones(h, safe_zones, rel["priority"])
        self.send_json(ok({**rel, "habitation_id": int(hab_id),
                           "habitation_name": h["name"],
                           "population": h["population"],
                           "recommended_safe_zones": ranked}))

    def handle_relocation_all(self, *_, params=None):
        habs = execute_query("SELECT * FROM habitations")
        results = []
        for h in habs:
            risk = calculate_risk(h)
            cap = calculate_capacity(h)
            rel = calculate_relocation_priority(h, risk, cap)
            safe_zones = execute_query("SELECT * FROM safe_zones")
            ranked = rank_safe_zones(h, safe_zones, rel["priority"])
            results.append({
                "id": h["id"], "name": h["name"], "district": h["district"],
                "state": h["state"], "population": h["population"],
                "risk_score": risk["risk_score"], "risk_class": risk["risk_class"],
                "capacity_utilization": cap["overall_utilization"],
                "priority": rel["priority"], "priority_score": rel["priority_score"],
                "top_safe_zone": ranked[0] if ranked else None,
            })
        results.sort(key=lambda x: x["priority_score"], reverse=True)
        self.send_json(ok(results))

    def handle_alerts(self, *_, params=None):
        alerts = execute_query(
            "SELECT * FROM alerts ORDER BY "
            "CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'WARNING' THEN 3 ELSE 4 END, "
            "timestamp DESC"
        )
        self.send_json(ok(alerts))

    def handle_hazards(self, *_, params=None):
        events = execute_query("SELECT * FROM hazard_events ORDER BY year DESC")
        self.send_json(ok(events))

    def handle_simulation_presets(self, *_, params=None):
        self.send_json(ok([
            {"id": "rainfall_20", "name": "20% Rainfall Increase",
             "description": "Simulates a 20% increase in rainfall intensity.",
             "parameters": {"rainfall_multiplier": 1.2}},
            {"id": "major_flood", "name": "Major Flood Event",
             "description": "Simulates a major flood with elevated water levels and reduced road access.",
             "parameters": {"flood_level": 4, "road_availability_pct": 40}},
            {"id": "population_50", "name": "50% Population Growth",
             "description": "Simulates 50% population increase due to migration or displacement.",
             "parameters": {"population_change_pct": 50}},
            {"id": "shelter_increase", "name": "Double Shelter Capacity",
             "description": "Intervention: 100% increase in emergency shelter and 50% healthcare capacity.",
             "parameters": {"shelter_capacity_change_pct": 100, "healthcare_capacity_change_pct": 50}},
            {"id": "worst_case", "name": "Worst Case Scenario",
             "description": "Combined stress: major flood + 20% population growth + infrastructure damage.",
             "parameters": {"flood_level": 5, "population_change_pct": 20,
                             "road_availability_pct": 30, "rainfall_multiplier": 2.0}},
        ]))

    # ── POST Handlers ─────────────────────────────────────────────────────────

    def handle_login(self, body):
        username = body.get("username", "")
        password = body.get("password", "")
        user = execute_one("SELECT * FROM users WHERE username = ?", (username,))
        if not user or not verify_password(password, user["password"]):
            self.send_json(err("Invalid credentials", 401)[0], 401)
            return
        token = create_mock_token(user["username"], user["role"])
        self.send_json(ok({
            "access_token": token, "token_type": "bearer",
            "username": user["username"], "role": user["role"],
            "full_name": user.get("full_name", user["username"]),
            "region": user.get("region", "All India"),
        }, "Login successful"))

    def handle_analyze_risk(self, body):
        hab_id = body.get("habitation_id")
        weights = body.get("weights")
        if not hab_id:
            self.send_json(err("habitation_id required")[0], 400)
            return
        h = execute_one("SELECT * FROM habitations WHERE id = ?", (int(hab_id),))
        if not h:
            self.send_json(err("Habitation not found", 404)[0], 404)
            return
        result = calculate_risk(h, weights=weights)
        self.send_json(ok(result, "Risk analysis complete"))

    def handle_simulate(self, body):
        hab_id = body.get("habitation_id")
        params = body.get("parameters", {})
        if not hab_id:
            self.send_json(err("habitation_id required")[0], 400)
            return
        h = execute_one("SELECT * FROM habitations WHERE id = ?", (int(hab_id),))
        if not h:
            self.send_json(err("Habitation not found", 404)[0], 404)
            return
        result = run_simulation(h, params)
        execute_write(
            "INSERT INTO simulation_runs (habitation_id, parameters, result) VALUES (?, ?, ?)",
            (int(hab_id), json.dumps(params), json.dumps(result, default=str))
        )
        self.send_json(ok(result, "Simulation complete"))

    def handle_relocation_recommend(self, body):
        hab_id = body.get("habitation_id")
        if not hab_id:
            self.send_json(err("habitation_id required")[0], 400)
            return
        h = execute_one("SELECT * FROM habitations WHERE id = ?", (int(hab_id),))
        if not h:
            self.send_json(err("Not found", 404)[0], 404)
            return
        risk = calculate_risk(h)
        cap = calculate_capacity(h)
        rel = calculate_relocation_priority(h, risk, cap)
        safe_zones = execute_query("SELECT * FROM safe_zones")
        ranked = rank_safe_zones(h, safe_zones, rel["priority"])
        self.send_json(ok({"priority": rel["priority"], "recommended_safe_zones": ranked}))

    def handle_reports(self, body):
        hab_id = body.get("habitation_id")
        generated_at = datetime.datetime.now().isoformat()

        if hab_id:
            h = execute_one("SELECT * FROM habitations WHERE id = ?", (int(hab_id),))
            if not h:
                self.send_json(err("Habitation not found", 404)[0], 404)
                return
            risk = calculate_risk(h)
            cap = calculate_capacity(h)
            rel = calculate_relocation_priority(h, risk, cap)
            safe_zones = execute_query("SELECT * FROM safe_zones")
            ranked = rank_safe_zones(h, safe_zones, rel["priority"])
            pop = int(h.get("population", 0))
            vuln = (int(h.get("children_count", 0)) + int(h.get("elderly_count", 0)) +
                    int(h.get("disabled_count", 0)) + int(h.get("pregnant_women_count", 0)))
            self.send_json(ok({
                "report_type": "habitation", "generated_at": generated_at,
                "habitation": h,
                "executive_summary": {
                    "name": h["name"], "district": h["district"], "state": h["state"],
                    "population": pop, "risk_score": risk["risk_score"],
                    "risk_class": risk["risk_class"],
                    "capacity_utilization": cap["overall_utilization"],
                    "capacity_status": cap["overall_status"],
                    "relocation_priority": rel["priority"],
                    "vulnerable_population": vuln,
                    "vulnerable_pct": round(vuln / max(pop, 1) * 100, 1),
                },
                "risk_assessment": risk,
                "capacity_assessment": cap,
                "relocation_assessment": {**rel, "recommended_safe_zones": ranked[:3]},
                "methodology": "Weighted rule-based risk scoring model (7 factors). Prototype only.",
                "disclaimer": DISCLAIMER,
            }))
        else:
            habs = execute_query("SELECT * FROM habitations")
            redzones = execute_query("SELECT * FROM red_zones")
            critical_habs = []
            for h in habs:
                risk = calculate_risk(h)
                cap = calculate_capacity(h)
                if risk["risk_class"] in ("HIGH", "CRITICAL"):
                    rel = calculate_relocation_priority(h, risk, cap)
                    critical_habs.append({
                        "id": h["id"], "name": h["name"], "district": h["district"],
                        "population": h["population"], "risk_score": risk["risk_score"],
                        "risk_class": risk["risk_class"], "priority": rel["priority"],
                    })
            self.send_json(ok({
                "report_type": "regional", "generated_at": generated_at,
                "total_habitations": len(habs),
                "critical_habitations": sorted(critical_habs, key=lambda x: x["risk_score"], reverse=True),
                "red_zones_count": len(redzones),
                "methodology": "Weighted rule-based risk model. Demonstration data only.",
                "disclaimer": DISCLAIMER,
            }))

    def handle_replace_all_habitations(self, body):
        # body should be a list of habitation dicts
        if not isinstance(body, list):
            if isinstance(body, dict) and isinstance(body.get('habitations'), list):
                body = body['habitations']
            else:
                self.send_json(err("Expected a JSON array of habitations")[0], 400)
                return
        if len(body) == 0:
            self.send_json(err("Empty array — nothing to insert")[0], 400)
            return
        try:
            execute_write("DELETE FROM habitations")
            params_list = []
            for h in body:
                params_list.append((
                    str(h.get('name', 'Unknown'))[:200],
                    str(h.get('district', 'Unknown'))[:200],
                    str(h.get('state', 'Unknown'))[:200],
                    float(h.get('latitude', 20.0)),
                    float(h.get('longitude', 78.0)),
                    float(h.get('elevation', 100.0)),
                    int(h.get('population', 0)),
                    int(h.get('children_count', 0)),
                    int(h.get('elderly_count', 0)),
                    int(h.get('disabled_count', 0)),
                    int(h.get('pregnant_women_count', 0)),
                    int(h.get('below_poverty_count', 0)),
                    int(h.get('housing_quality', 3)),
                    int(h.get('road_accessibility', 3)),
                    str(h.get('hazard_type', 'flood'))[:50],
                    float(h.get('hazard_severity', 0.5)),
                    float(h.get('distance_from_hazard_km', 5.0)),
                    int(h.get('historical_event_count', 0)),
                    int(h.get('last_event_year', 2020)),
                    float(h.get('water_capacity_liters_per_day', 0)),
                    int(h.get('shelter_capacity_persons', 0)),
                    int(h.get('healthcare_beds', 0)),
                    int(h.get('evacuation_route_quality', 3)),
                    float(h.get('food_stock_days', 7.0)),
                    float(h.get('sanitation_coverage_pct', 60.0)),
                    float(h.get('safe_land_area_sqkm', 1.0)),
                    int(h.get('nearby_hospital_count', 0)),
                    int(h.get('nearby_school_count', 0)),
                    int(h.get('nearby_shelter_count', 0)),
                    float(h.get('rainfall_annual_mm', 800.0)),
                    float(h.get('slope_degrees', 2.0)),
                    str(h.get('soil_type', 'Alluvial'))[:100],
                ))
            execute_many(
                """INSERT INTO habitations (
                    name, district, state, latitude, longitude, elevation, population,
                    children_count, elderly_count, disabled_count, pregnant_women_count,
                    below_poverty_count, housing_quality, road_accessibility,
                    hazard_type, hazard_severity, distance_from_hazard_km,
                    historical_event_count, last_event_year,
                    water_capacity_liters_per_day, shelter_capacity_persons,
                    healthcare_beds, evacuation_route_quality, food_stock_days,
                    sanitation_coverage_pct, safe_land_area_sqkm,
                    nearby_hospital_count, nearby_school_count, nearby_shelter_count,
                    rainfall_annual_mm, slope_degrees, soil_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                params_list
            )
            self.send_json(ok({
                "inserted": len(params_list),
                "message": f"Successfully replaced all habitations with {len(params_list)} new records."
            }, "Replace complete"))
        except Exception as e:
            self.send_json(err(f"Database error: {str(e)}")[0], 500)

    def handle_upload(self, body):
        # For multipart we read raw content-type
        content_type = self.headers.get("Content-Type", "")
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length > 0 else b""

        required_cols = ["name", "latitude", "longitude", "population",
                         "district", "state", "hazard_type", "hazard_severity"]

        if "csv" in content_type.lower() or b"," in raw[:200]:
            try:
                text = raw.decode("utf-8", errors="ignore")
                lines = [l.strip() for l in text.splitlines() if l.strip()]
                if not lines:
                    self.send_json(err("Empty file")[0], 400)
                    return
                headers = [h.strip().lower() for h in lines[0].split(",")]
                missing = [c for c in required_cols if c not in headers]
                errors = [f"Missing required columns: {', '.join(missing)}"] if missing else []
                total = len(lines) - 1
                preview = []
                for line in lines[1:6]:
                    row = dict(zip(headers, [v.strip() for v in line.split(",")]))
                    preview.append(row)
                self.send_json(ok({
                    "total_rows": total, "preview": preview, "errors": errors,
                    "valid": len(errors) == 0, "required_columns": required_cols,
                    "message": "Validated" if not errors else f"{len(errors)} error(s) found",
                }))
            except Exception as e:
                self.send_json(err(f"Parse error: {e}")[0], 400)
        else:
            self.send_json(ok({"message": "File received. Validate and import manually.", "required_columns": required_cols}))


def run():
    import socketserver
    from app.database import USE_POSTGRES, count_rows
    from app.data.schema import create_schema

    # Create schema (idempotent — safe on every boot)
    create_schema()

    # Seed only if empty — critical for Render (restarts the dyno each deploy)
    if count_rows("habitations") == 0:
        print("[startup] Empty database — seeding demo data...")
        from app.data.seed import seed_database
        seed_database()
    else:
        print(f"[startup] Database has {count_rows('habitations')} habitations — skipping seed.")

    db_label = "PostgreSQL (Neon)" if USE_POSTGRES else "SQLite (local)"
    print(f"[startup] Database: {db_label}")

    port = int(os.environ.get("PORT", PORT))
    with socketserver.TCPServer(("0.0.0.0", port), DRIPSHandler) as httpd:
        print(f"[DRIPS] Server running at http://0.0.0.0:{port}")
        print(f"[DRIPS] API: http://localhost:{port}/api/")
        print(f"[DRIPS] Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[DRIPS] Server stopped.")



if __name__ == "__main__":
    run()
