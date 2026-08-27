export interface User {
  id: string;
  username: string;
  role: 'admin' | 'officer' | 'viewer';
  name: string;
}

export interface Habitation {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation: number;
  population: number;
  children_count: number;
  elderly_count: number;
  disabled_count: number;
  pregnant_women_count: number;
  below_poverty_count: number;
  housing_quality: number;
  road_accessibility: number;
  hazard_type: string;
  hazard_severity: number;
  distance_from_hazard_km: number;
  historical_event_count: number;
  last_event_year: number;
  water_capacity_liters_per_day: number;
  shelter_capacity_persons: number;
  healthcare_beds: number;
  evacuation_route_quality: number;
  food_stock_days: number;
  sanitation_coverage_pct: number;
  safe_land_area_sqkm: number;
  nearby_hospital_count: number;
  nearby_school_count: number;
  nearby_shelter_count: number;
  rainfall_annual_mm: number;
  slope_degrees: number;
  soil_type: string;
  risk_score: number;
  risk_class: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  capacity_utilization: number;
  capacity_status: 'SAFE' | 'STRESSED' | 'OVERLOADED' | 'CRITICAL' | string;
  relocation_priority: 'P1-IMMEDIATE' | 'P2-URGENT' | 'P3-PLANNED' | 'P4-MONITOR' | string;
  primary_hazard: string;
  contributing_factors: Array<{factor: string, score: number, contribution: number, description: string}>;
  explanation: string;
  recommended_actions: string[];
}

export interface RedZone {
  id: string;
  name: string;
  hazard_type: string;
  risk_score: number;
  population_exposed: number;
  habitation_count: number;
  capacity_stress: number;
  relocation_priority: string;
  polygon: Array<[number, number]>;
  description: string;
}

export interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  available_capacity: number;
  safety_score: number;
  healthcare_access: string;
  road_access: string;
  water_availability: string;
  district: string;
  state: string;
}

export interface Alert {
  id: string;
  severity: string;
  title: string;
  message: string;
  population_affected: number;
  recommended_action: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface HazardEvent {
  year: number;
  hazard_type: string;
  districts: string;
  deaths: number;
  displaced: number;
}
