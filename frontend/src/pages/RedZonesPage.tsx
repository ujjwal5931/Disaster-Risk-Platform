import { useState, useMemo } from 'react';
import { seedRedZones } from '../data/seedData';
import { PageHeader, PriorityBadge, CapacityBar, RiskBadge, Disclaimer } from '../components/ui';
import { useHabitations } from '../hooks/useHabitations';

export default function RedZonesPage() {
  const { allHabitations, relocatedIds } = useHabitations();

  // Build dynamic red zones from CRITICAL or overloaded habitations
  const dynamicRedZones = useMemo(() => {
    return allHabitations
      .filter(h => h.risk_class === 'CRITICAL' || (h.capacity_utilization || 0) > 110)
      .map(h => ({
        id: h.id,
        name: h.name,
        hazard_type: h.hazard_type || 'unknown',
        risk_score: h.risk_score,
        population_exposed: h.population || 0,
        relocation_priority: h.relocation_priority,
        capacity_stress: h.capacity_utilization || 0,
        polygon: [],
        habitation_count: 1,
        isDynamic: true,
        isRelocated: relocatedIds.has(h.id),
        district: h.district,
        state: h.state,
      }));
  }, [allHabitations, relocatedIds]);

  // Merge: seed red zones first (marked static), then dynamic ones not already in seed
  const seedIds = new Set(seedRedZones.map(rz => rz.id));
  const extraDynamic = dynamicRedZones.filter(d => !seedIds.has(d.id));

  const allZones = [
    ...seedRedZones.map(rz => ({ ...rz, isDynamic: false, isRelocated: relocatedIds.has(rz.id), district: '', state: '' })),
    ...extraDynamic,
  ].sort((a, b) => b.risk_score - a.risk_score);

  const [selected, setSelected] = useState<any>(allZones[0]);

  return (
    <div className="p-6 h-full flex flex-col">
      <PageHeader title="Red Zones" subtitle="High-risk geographic zones — includes static defined zones and dynamic zones from uploaded critical habitations." />

      {/* Summary bar */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="bg-red-50 border border-red-200 rounded px-3 py-1.5 text-red-700 font-medium">
          {allZones.length} Total Red Zones
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded px-3 py-1.5 text-blue-700 font-medium">
          {seedRedZones.length} Static Zones
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded px-3 py-1.5 text-orange-700 font-medium">
          {extraDynamic.length} Dynamic Zones (from uploaded data)
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded px-3 py-1.5 text-emerald-700 font-medium">
          {allZones.filter(z => z.isRelocated).length} Relocated
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 sticky top-0 uppercase text-xs text-slate-500">
              <tr>
                <th className="p-3">Zone ID / Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Hazard</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Pop Exposed</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {allZones.map(rz => (
                <tr
                  key={rz.id}
                  onClick={() => setSelected(rz)}
                  className={`cursor-pointer border-b hover:bg-slate-50 transition-colors ${
                    selected?.id === rz.id ? 'bg-blue-50' : rz.isRelocated ? 'bg-emerald-50' : ''
                  }`}
                >
                  <td className="p-3 font-medium">
                    {rz.id}
                    <br />
                    <span className="text-xs text-slate-500">{rz.name}</span>
                  </td>
                  <td className="p-3">
                    {rz.isDynamic ? (
                      <span className="text-[11px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded">DYNAMIC</span>
                    ) : (
                      <span className="text-[11px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">STATIC</span>
                    )}
                  </td>
                  <td className="p-3 capitalize">{rz.hazard_type}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 h-2 rounded-full">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${rz.risk_score}%` }} />
                      </div>
                      <span className="font-mono font-bold">{rz.risk_score}</span>
                    </div>
                  </td>
                  <td className="p-3">{(rz.population_exposed || 0).toLocaleString()}</td>
                  <td className="p-3"><PriorityBadge priority={rz.relocation_priority} /></td>
                  <td className="p-3">
                    {rz.isRelocated ? (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">✓ RELOCATED</span>
                    ) : (
                      <span className="text-[11px] bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded">⚠ ACTIVE</span>
                    )}
                  </td>
                </tr>
              ))}
              {allZones.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-slate-400">No red zones found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-80 bg-white rounded-lg shadow-sm border border-slate-200 p-4 overflow-auto flex-shrink-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.id}</p>
              </div>
              {selected.isDynamic ? (
                <span className="text-[11px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded">DYNAMIC</span>
              ) : (
                <span className="text-[11px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">STATIC</span>
              )}
            </div>

            {selected.isRelocated && (
              <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-semibold">
                ✓ This zone's habitation has been relocated to a safe area.
              </div>
            )}

            <div className="space-y-3 text-sm">
              {selected.district && (
                <div><strong>Location:</strong> {selected.district}{selected.state ? `, ${selected.state}` : ''}</div>
              )}
              <div><strong>Hazard:</strong> <span className="capitalize">{selected.hazard_type}</span></div>
              <div><strong>Risk Score:</strong> <span className="font-bold text-red-600">{selected.risk_score}/100</span></div>
              <div>
                <strong>Risk Class:</strong>{' '}
                <RiskBadge riskClass={selected.risk_score >= 75 ? 'CRITICAL' : selected.risk_score >= 50 ? 'HIGH' : 'MODERATE'} />
              </div>
              <div><strong>Pop Exposed:</strong> {(selected.population_exposed || 0).toLocaleString()}</div>
              {selected.habitation_count && (
                <div><strong>Habitations:</strong> {selected.habitation_count}</div>
              )}
              {selected.capacity_stress !== undefined && (
                <div>
                  <strong>Capacity Stress:</strong> {selected.capacity_stress}%
                  <CapacityBar
                    utilization={selected.capacity_stress}
                    status={selected.capacity_stress > 120 ? 'CRITICAL' : 'OVERLOADED'}
                  />
                </div>
              )}
              <div><strong>Priority:</strong> <PriorityBadge priority={selected.relocation_priority} /></div>
              {!selected.isDynamic && selected.polygon && (
                <div><strong>Polygon Vertices:</strong> {selected.polygon.length} points</div>
              )}
            </div>
          </div>
        )}
      </div>
      <Disclaimer />
    </div>
  );
}