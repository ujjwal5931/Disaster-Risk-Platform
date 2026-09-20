import { create } from 'zustand';
import { User } from '../types';

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
  habitations: any[];
  setHabitations: (habs: any[]) => void;
  addUploadedHabitations: (newHabs: any[]) => void;
  relocationPlans: Record<string, { safeZoneId: string; safeZoneName: string; timestamp: string }>;
  assignRelocation: (habitationId: string, safeZone: any) => void;
  riskWeights: Record<string, number>;
  setRiskWeight: (key: string, value: number) => void;
  simulationParams: Record<string, number>;
  setSimulationParam: (key: string, value: number) => void;
  simulationResult: any | null;
  setSimulationResult: (result: any) => void;
}

// Load persisted custom habitations from localStorage if any
const getStoredHabitations = () => {
  try {
    const raw = localStorage.getItem('purva_drishti_uploaded_habitations');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
};

const getStoredRelocations = () => {
  try {
    const raw = localStorage.getItem('purva_drishti_relocation_plans');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return {};
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
  habitations: getStoredHabitations(),
  setHabitations: (habs) => set({ habitations: habs }),
  addUploadedHabitations: (newHabs) => set((state) => {
    const updated = [...state.habitations, ...newHabs];
    try {
      localStorage.setItem('purva_drishti_uploaded_habitations', JSON.stringify(updated));
    } catch (e) {}
    return { habitations: updated };
  }),
  relocationPlans: getStoredRelocations(),
  assignRelocation: (habitationId, safeZone) => set((state) => {
    const updated = {
      ...state.relocationPlans,
      [habitationId]: {
        safeZoneId: safeZone.id || safeZone.name,
        safeZoneName: safeZone.name,
        timestamp: new Date().toLocaleString()
      }
    };
    try {
      localStorage.setItem('purva_drishti_relocation_plans', JSON.stringify(updated));
    } catch (e) {}
    return { relocationPlans: updated };
  }),
  riskWeights: { hazard: 0.4, vulnerability: 0.3, exposure: 0.3 },
  setRiskWeight: (key, value) => set((state) => ({ riskWeights: { ...state.riskWeights, [key]: value } })),
  simulationParams: { populationChange: 0, rainfallIntensity: 0, floodLevel: 0, hazardSeverity: 0, shelterCapacityChange: 0, healthcareCapacityChange: 0, roadAvailability: 100 },
  setSimulationParam: (key, value) => set((state) => ({ simulationParams: { ...state.simulationParams, [key]: value } })),
  simulationResult: null,
  setSimulationResult: (result) => set({ simulationResult: result }),
}));
