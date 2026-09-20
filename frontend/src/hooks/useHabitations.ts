import { useMemo } from 'react';
import { seedHabitations } from '../data/seedData';
import { useStore, computeWeightedRisk, getRiskClass, getRelocationPriority } from '../store/useStore';

/**
 * Shared hook — all pages use this to get the live habitation list.
 * - Respects isReplaceMode (uploaded data replaces seed or appends)
 * - Recomputes risk scores when platform weights change
 * - Marks habitations as relocated when relocation plans exist
 */
export function useHabitations() {
  const customHabs = useStore(s => s.habitations);
  const isReplaceMode = useStore(s => s.isReplaceMode);
  const relocationPlans = useStore(s => s.relocationPlans);
  const weightConfig = useStore(s => s.weightConfig);
  const weightsVersion = useStore(s => s.weightsVersion);

  const allHabitations = useMemo(() => {
    // Step 1: determine base list
    const base: any[] = isReplaceMode && customHabs.length > 0
      ? customHabs
      : [...seedHabitations, ...customHabs];

    // Step 2: recompute risk using current weights (if weights have been customized)
    const withRisk = base.map(h => {
      const newScore = computeWeightedRisk(h, weightConfig);
      const newClass = getRiskClass(newScore);
      const newPriority = getRelocationPriority(newScore, h.capacity_utilization ?? 0);
      return {
        ...h,
        risk_score: newScore,
        risk_class: newClass,
        relocation_priority: newPriority,
      };
    });

    return withRisk;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHabs, isReplaceMode, weightsVersion, weightConfig]);

  const relocatedIds = useMemo(() => new Set(Object.keys(relocationPlans)), [relocationPlans]);

  /** Non-relocated habitations only */
  const activeHabitations = useMemo(
    () => allHabitations.filter(h => !relocatedIds.has(h.id)),
    [allHabitations, relocatedIds]
  );

  /** Relocated habitations with their destination */
  const relocatedHabitations = useMemo(
    () => allHabitations
      .filter(h => relocatedIds.has(h.id))
      .map(h => ({ ...h, _relocationPlan: relocationPlans[h.id] })),
    [allHabitations, relocatedIds, relocationPlans]
  );

  return {
    allHabitations,
    activeHabitations,
    relocatedHabitations,
    relocatedIds,
    relocationPlans,
    weightConfig,
  };
}
