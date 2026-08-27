import axios from 'axios';
import { seedHabitations, seedRedZones, seedSafeZones } from '../data/seedData';

const API_BASE = 'http://localhost:8000/api';

export async function fetchWithFallback<T>(endpoint: string, fallbackFn: () => T): Promise<T> {
  try {
    const response = await axios.get(`${API_BASE}${endpoint}`, { timeout: 2000 });
    return response.data.data;
  } catch {
    console.info('Backend unavailable, using demo data for ' + endpoint);
    return fallbackFn();
  }
}

export const api = {
  getHabitations: () => fetchWithFallback('/habitations', () => seedHabitations),
  getHabitation: (id: string) => fetchWithFallback(`/habitations/${id}`, () => seedHabitations.find(h => h.id === id)),
  getRedZones: () => fetchWithFallback('/red-zones', () => seedRedZones),
  getSafeZones: () => fetchWithFallback('/safe-zones', () => seedSafeZones),
};
