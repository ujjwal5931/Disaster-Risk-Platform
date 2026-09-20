import { useState, useEffect, useMemo } from 'react';
import { useStore, computeWeightedRisk, getRiskClass, getRelocationPriority } from '../store/useStore';
import { seedHabitations, seedSafeZones } from '../data/seedData';
import { fetchHabitations, type ApiHabitation } from '../api/client';

// Cache fetched data in module scope so all hook instances share it
// and re-fetches only happen on explicit refresh
let _cachedHabitations: ApiHabitation[] | null = null;
let _isFetching = false;
const _listeners: (() => void)[] = [];

function notifyListeners() {
  _listeners.forEach(fn => fn());
}

/**
 * Trigger a fresh fetch from the backend and notify all hook instances.
 * Call this after uploading new data.
 */
export async function refreshHabitations(): Promise<void> {
  _cachedHabitations = null;
  _isFetching = false;
  notifyListeners();
}

export function useHabitations() {
  const weightConfig = useStore(s => s.weightConfig);
  const weightsVersion = useStore(s => s.weightsVersion);
  const relocationPlans = useStore(s => s.relocationPlans);

  const [apiHabs, setApiHabs] = useState<ApiHabitation[]>(_cachedHabitations ?? []);
  const [loading, setLoading] = useState(!_cachedHabitations);
  const [error, setError] = useState<string | null>(null);

  // Force re-render when module cache updates
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    _listeners.push(listener);
    return () => {
      const i = _listeners.indexOf(listener);
      if (i >= 0) _listeners.splice(i, 1);
    };
  }, []);

  // Fetch from backend once (or when cache is invalidated)
  useEffect(() => {
    if (_cachedHabitations) {
      setApiHabs(_cachedHabitations);
      setLoading(false);
      return;
    }
    if (_isFetching) return;
    _isFetching = true;
    setLoading(true);
    setError(null);

    fetchHabitations()
      .then(habs => {
        _cachedHabitations = habs;
        _isFetching = false;
        setApiHabs(habs);
        setLoading(false);
        notifyListeners();
      })
      .catch(err => {
        console.warn('[useHabitations] API fetch failed, falling back to seed data:', err.message);
        _isFetching = false;
        // Fallback to seed data if backend is unreachable
        const fallback = seedHabitations as unknown as ApiHabitation[];
        _cachedHabitations = fallback;
        setApiHabs(fallback);
        setLoading(false);
        setError('Using offline data — backend unreachable');
      });
  }, [tick]);

  // Apply client-side weight recomputation on top of API data
  const allHabitations = useMemo(() => {
    return apiHabs.map(h => {
      const newScore = computeWeightedRisk(h as any, weightConfig);
      const newClass = getRiskClass(newScore);
      const newPriority = getRelocationPriority(newScore, h.capacity_utilization ?? 0);
      const plan = relocationPlans[String(h.id)];
      return {
        ...h,
        risk_score: newScore,
        risk_class: newClass,
        relocation_priority: newPriority,
        _relocationPlan: plan,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiHabs, weightsVersion, relocationPlans]);

  const relocatedIds = useMemo(() => new Set(Object.keys(relocationPlans)), [relocationPlans]);

  const activeHabitations = useMemo(
    () => allHabitations.filter(h => !relocatedIds.has(String(h.id))),
    [allHabitations, relocatedIds]
  );

  const relocatedHabitations = useMemo(
    () => allHabitations.filter(h => relocatedIds.has(String(h.id))),
    [allHabitations, relocatedIds]
  );

  return {
    allHabitations,
    activeHabitations,
    relocatedHabitations,
    relocatedIds,
    relocationPlans,
    weightConfig,
    loading,
    error,
    safeZones: seedSafeZones,
  };
}
