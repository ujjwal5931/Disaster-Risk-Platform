import { create } from 'zustand';
import { User } from '../types';

export interface WeightConfig {
  haz: number;
  pop: number;
  vul: number;
  inf: number;
  hist: number;
  emerg: number;
  env: number;
}

export const DEFAULT_WEIGHTS: WeightConfig = {
  haz: 25,
  pop: 20,
  vul: 15,
  inf: 15,
  hist: 10,
  emerg: 10,
  env: 5,
};

// Compute risk score from raw habitation data + weights
export function computeWeightedRisk(h: any, w: WeightConfig): number {
  const hazardScore = (h.hazard_severity || 0.5) * 100;
  const popScore = Math.min(100, ((h.population || 1000) / 20000) * 100);
  const totalVul = (h.children_count || 0) + (h.elderly_count || 0) + (h.disabled_count || 0) + (h.pregnant_women_count || 0);
  const vulScore = Math.min(100, (totalVul / Math.max(1, h.population || 1)) * 100);
  const hq = h.housing_quality || 3;
  const ra = h.road_accessibility || 3;
  const infScore = Math.round(((5 - hq) / 4 + (5 - ra) / 4) / 2 * 100);
  const histScore = Math.min(100, (h.historical_event_count || 0) * 14);
  const beds = h.healthcare_beds || 1;
  const hosp = h.nearby_hospital_count || 0;
  const emergScore = Math.max(0, Math.min(100, 100 - beds * 2 - hosp * 15));
  const slope = h.slope_degrees || 2;
  const rain = h.rainfall_annual_mm || 800;
  const envScore = Math.min(100, slope * 2 + Math.max(0, (3000 - rain) / 30));

  const weighted =
    (w.haz / 100) * hazardScore +
    (w.pop / 100) * popScore +
    (w.vul / 100) * vulScore +
    (w.inf / 100) * infScore +
    (w.hist / 100) * histScore +
    (w.emerg / 100) * emergScore +
    (w.env / 100) * envScore;

  return Math.max(1, Math.min(100, Math.round(weighted)));
}

export function getRiskClass(score: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MODERATE';
  return 'LOW';
}

export function getRelocationPriority(score: number, capUtil: number): string {
  if (score >= 75 || capUtil > 120) return 'P1-IMMEDIATE';
  if (score >= 50 || capUtil > 100) return 'P2-URGENT';
  if (score >= 25) return 'P3-PLANNED';
  return 'P4-MONITOR';
}

interface AppState {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  currentDemoStep: number;
  advanceDemoStep: () => void;
  filters: {
    hazardType: string | null;
    riskLevel: string | null;
    district: string | null;
    priorityLevel: string | null;
    populationRange: [number, number] | null;
  };
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  selectedHabitationId: string | null;
  setSelectedHabitation: (id: string | null) => void;
  isReplaceMode: boolean;
  habitations: any[];
  setHabitations: (habs: any[]) => void;
  addUploadedHabitations: (newHabs: any[]) => void;
  replaceAllHabitations: (newHabs: any[]) => void;
  clearUploadedHabitations: () => void;
  relocationPlans: Record<string, { safeZoneId: string; safeZoneName: string; timestamp: string }>;
  assignRelocation: (habitationId: string, safeZone: any) => void;
  removeRelocation: (habitationId: string) => void;
  // Platform weights
  weightConfig: WeightConfig;
  weightsVersion: number; // increments on apply — triggers recompute
  applyWeights: (w: WeightConfig) => void;
  resetWeights: () => void;
  // Alerts
  acknowledgedAlerts: string[];
  acknowledgeAlert: (id: string) => void;
  // Simulation
  simulationParams: Record<string, number>;
  setSimulationParam: (key: string, value: number) => void;
  simulationResult: any | null;
  setSimulationResult: (result: any) => void;
}

const getStoredHabitations = (): any[] => {
  try {
    const raw = localStorage.getItem('purva_drishti_uploaded_habitations');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

const getStoredRelocations = (): Record<string, any> => {
  try {
    const raw = localStorage.getItem('purva_drishti_relocation_plans');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
};

const getStoredWeights = (): WeightConfig => {
  try {
    const raw = localStorage.getItem('purva_drishti_custom_weights');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_WEIGHTS;
};

const getStoredAcknowledgedAlerts = (): string[] => {
  try {
    const raw = localStorage.getItem('purva_drishti_ack_alerts');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

export const useStore = create<AppState>((set) => ({
  user: null,
  login: async (username, password) => {
    if (
      (username === 'admin' && password === 'admin123') ||
      (username === 'officer' && password === 'officer123') ||
      (username === 'viewer' && password === 'viewer123')
    ) {
      set({ user: { id: '1', username, name: username.toUpperCase(), role: username as any } });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null }),
  isDemoMode: false,
  toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
  currentDemoStep: 1,
  advanceDemoStep: () => set((state) => ({ currentDemoStep: state.currentDemoStep + 1 })),
  filters: {
    hazardType: null,
    riskLevel: null,
    district: null,
    priorityLevel: null,
    populationRange: null,
  },
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  clearFilters: () => set({ filters: { hazardType: null, riskLevel: null, district: null, priorityLevel: null, populationRange: null } }),
  selectedHabitationId: null,
  setSelectedHabitation: (id) => set({ selectedHabitationId: id }),
  isReplaceMode: typeof window !== 'undefined' && localStorage.getItem('purva_drishti_replace_mode') === 'true',
  habitations: getStoredHabitations(),
  setHabitations: (habs) => set({ habitations: habs }),
  addUploadedHabitations: (newHabs) => set((state) => {
    const updated = [...state.habitations, ...newHabs];
    try {
      localStorage.setItem('purva_drishti_uploaded_habitations', JSON.stringify(updated));
      localStorage.removeItem('purva_drishti_replace_mode');
    } catch (e) {}
    return { habitations: updated, isReplaceMode: false };
  }),
  replaceAllHabitations: (newHabs) => set(() => {
    try {
      localStorage.setItem('purva_drishti_uploaded_habitations', JSON.stringify(newHabs));
      localStorage.setItem('purva_drishti_replace_mode', 'true');
    } catch (e) {}
    return { habitations: newHabs, isReplaceMode: true };
  }),
  clearUploadedHabitations: () => set(() => {
    try {
      localStorage.removeItem('purva_drishti_uploaded_habitations');
      localStorage.removeItem('purva_drishti_replace_mode');
    } catch (e) {}
    return { habitations: [], isReplaceMode: false };
  }),
  relocationPlans: getStoredRelocations(),
  assignRelocation: (habitationId, safeZone) => set((state) => {
    const updated = {
      ...state.relocationPlans,
      [habitationId]: {
        safeZoneId: safeZone.id || safeZone.name,
        safeZoneName: safeZone.name,
        timestamp: new Date().toLocaleString(),
      },
    };
    try {
      localStorage.setItem('purva_drishti_relocation_plans', JSON.stringify(updated));
    } catch (e) {}
    return { relocationPlans: updated };
  }),
  removeRelocation: (habitationId) => set((state) => {
    const updated = { ...state.relocationPlans };
    delete updated[habitationId];
    try {
      localStorage.setItem('purva_drishti_relocation_plans', JSON.stringify(updated));
    } catch (e) {}
    return { relocationPlans: updated };
  }),
  weightConfig: getStoredWeights(),
  weightsVersion: 0,
  applyWeights: (w) => set((state) => {
    try {
      localStorage.setItem('purva_drishti_custom_weights', JSON.stringify(w));
    } catch (e) {}
    return { weightConfig: w, weightsVersion: state.weightsVersion + 1 };
  }),
  resetWeights: () => set((state) => {
    try {
      localStorage.removeItem('purva_drishti_custom_weights');
    } catch (e) {}
    return { weightConfig: DEFAULT_WEIGHTS, weightsVersion: state.weightsVersion + 1 };
  }),
  acknowledgedAlerts: getStoredAcknowledgedAlerts(),
  acknowledgeAlert: (id) => set((state) => {
    const updated = [...state.acknowledgedAlerts, id];
    try {
      localStorage.setItem('purva_drishti_ack_alerts', JSON.stringify(updated));
    } catch (e) {}
    return { acknowledgedAlerts: updated };
  }),
  simulationParams: { populationChange: 0, rainfallIntensity: 0, floodLevel: 0, hazardSeverity: 0, shelterCapacityChange: 0, healthcareCapacityChange: 0, roadAvailability: 100 },
  setSimulationParam: (key, value) => set((state) => ({ simulationParams: { ...state.simulationParams, [key]: value } })),
  simulationResult: null,
  setSimulationResult: (result) => set({ simulationResult: result }),
}));
