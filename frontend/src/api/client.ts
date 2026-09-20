// Central API client — all calls to the Render backend go through here
const API_BASE = 'https://disaster-risk-backend.onrender.com';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  // Backend wraps in { success, data }
  return (json.data ?? json) as T;
}

// ── Habitation type ───────────────────────────────────────────────────────────

export interface ApiHabitation {
  id: number;
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
  // Computed by backend risk/capacity engines
  risk_score: number;
  risk_class: string;
  capacity_utilization: number;
  capacity_status: string;
  relocation_priority: string;
  vulnerable_pct: number;
  // Frontend-only extras (derived client side)
  primary_hazard?: string;
  housing_quality_index?: number;
  recommended_actions?: string[];
  below_poverty_line_pct?: number;
  _relocationPlan?: any;
}

function buildRecommendedActions(h: ApiHabitation): string[] {
  const actions: string[] = [];
  if (h.risk_class === 'CRITICAL') actions.push('Initiate immediate evacuation procedures');
  if (h.risk_class === 'HIGH') actions.push('Pre-position emergency resources and alert residents');
  if ((h.capacity_utilization ?? 0) > 120) actions.push('Emergency shelter capacity expansion required');
  if ((h.capacity_utilization ?? 0) > 100) actions.push('Assess and expand carrying capacity');
  if (h.hazard_type === 'flood') actions.push('Install early warning flood monitoring systems');
  if (h.hazard_type === 'landslide') actions.push('Implement slope stabilization and restrict construction');
  if (h.hazard_type === 'cyclone') actions.push('Strengthen cyclone shelters and evacuation routes');
  if (h.hazard_type === 'drought') actions.push('Deploy water conservation and alternative supply measures');
  if (h.healthcare_beds < 5) actions.push('Establish mobile health units');
  if (h.road_accessibility <= 2) actions.push('Improve emergency access roads');
  if (actions.length === 0) actions.push('Continue regular monitoring and risk assessment');
  return actions.slice(0, 5);
}

function normaliseHab(h: ApiHabitation): ApiHabitation {
  return {
    ...h,
    primary_hazard: h.hazard_type,
    housing_quality_index: h.housing_quality,
    below_poverty_line_pct: h.population > 0 ? Math.round((h.below_poverty_count / h.population) * 100) : 0,
    recommended_actions: buildRecommendedActions(h),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchHabitations(): Promise<ApiHabitation[]> {
  const data = await apiFetch<{ items?: ApiHabitation[] } | ApiHabitation[]>('/api/habitations');
  const items: ApiHabitation[] = Array.isArray(data) ? data : (data as any).items ?? [];
  return items.map(normaliseHab);
}

export async function replaceAllHabitations(habitations: Partial<ApiHabitation>[]): Promise<{ inserted: number }> {
  // Strip frontend-only / ID fields before sending to backend
  const clean = habitations.map(h => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _relocationPlan, primary_hazard, housing_quality_index, recommended_actions,
            below_poverty_line_pct, id, risk_score, risk_class, capacity_utilization,
            capacity_status, relocation_priority, vulnerable_pct, ...rest } = h as any;
    return rest;
  });
  return apiFetch<{ inserted: number }>('/api/habitations/replace-all', {
    method: 'POST',
    body: JSON.stringify(clean),
  });
}
