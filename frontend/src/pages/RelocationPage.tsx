import { useState, useEffect } from 'react';
import { seedSafeZones } from '../data/seedData';
import { PageHeader, RiskBadge, PriorityBadge, Disclaimer } from '../components/ui';
import { useStore } from '../store/useStore';
import { useHabitations } from '../hooks/useHabitations';

export default function RelocationPage() {
  const [tab, setTab] = useState('P1-IMMEDIATE');
  const { allHabitations, relocationPlans } = useHabitations();
  const assignRelocation = useStore(s => s.assignRelocation);
  const removeRelocation = useStore(s => s.removeRelocation);

  // Show habitations that belong to the tab OR are already relocated
  const filtered = allHabitations.filter(h => h.relocation_priority === tab || relocationPlans[h.id]);
  const [sel, setSel] = useState(filtered[0] || null);

  // Update selected if filtered changes and current sel is not in it
  useEffect(() => {
    if (!sel || !filtered.find(h => h.id === sel.id)) {
      setSel(filtered[0] || null);
    }
  }, [tab, allHabitations, relocationPlans]);

  const TABS = ['P1-IMMEDIATE', 'P2-URGENT', 'P3-PLANNED', 'P4-MONITOR'];
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSelectRelocation = (sz: any) => {
    if (!sel) return;
    assignRelocation(sel.id, sz);
    setSuccessMsg(`Official Relocation Plan Registered: ${sel.name} will be relocated to ${sz.name}.`);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  const handleRemoveRelocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sel) return;
    removeRelocation(sel.id);
    setSuccessMsg(`Relocation Plan for ${sel.name} has been removed.`);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  // Calculate safe zone populations
  const getRemainingCapacity = (sz: any) => {
    let used = 0;
    Object.values(relocationPlans).forEach(plan => {
      if (plan.safeZoneName === sz.name) {
        used += 1500; // rough average habitation population
      }
    });
    return sz.available_capacity - used;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <PageHeader title="Relocation Logistics" subtitle="Manage and prioritize relocations to safe zones." />

      {successMsg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span className="font-medium text-sm">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold ml-4">✕</button>
        </div>
      )}
      
      <div className="flex border-b mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t}</button>
        ))}
      </div>

      <div className="flex-1 flex gap-6 min-h-0 mb-6">
        <div className="flex-1 overflow-auto space-y-4 pr-2">
          {filtered.length === 0 && <div className="text-slate-500">No habitations in this category.</div>}
          {filtered.map(h => {
            const isRelocated = relocationPlans[h.id];
            return (
              <div key={h.id} onClick={()=>setSel(h)} className={`p-4 bg-white border rounded shadow-sm cursor-pointer hover:border-blue-300 ${sel?.id === h.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'} ${isRelocated ? 'bg-green-50 border-green-300' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold ${isRelocated ? 'line-through text-green-800' : ''}`}>{h.name}</h3>
                  <RiskBadge riskClass={h.risk_class} />
                </div>
                <p className="text-sm text-slate-500 mb-2">{h.district}</p>
                <div className="flex gap-4 text-sm items-center justify-between">
                  <div><strong>Pop:</strong> {h.population.toLocaleString()}</div>
                  <div><strong>Cap:</strong> {h.capacity_utilization}%</div>
                  {isRelocated && (
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                      RELOCATED → {isRelocated.safeZoneName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sel && (
          <div className="w-[420px] bg-white border rounded shadow-sm flex flex-col flex-shrink-0">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className={`font-bold text-lg mb-1 ${relocationPlans[sel.id] ? 'line-through text-green-800' : ''}`}>{sel.name}</h3>
                <p className="text-xs text-slate-500">{sel.district}, {sel.state}</p>
              </div>
              <PriorityBadge priority={sel.relocation_priority} />
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <h4 className="font-bold mb-3 text-slate-800">Top 3 Recommended Safe Zones</h4>
              <div className="space-y-4">
                {seedSafeZones.slice(0,3).map((sz, i) => {
                  const currentPlan = relocationPlans[sel.id];
                  const isAssigned = currentPlan?.safeZoneName === sz.name;
                  const remaining = getRemainingCapacity(sz);
                  return (
                    <div key={sz.id} className={`p-3 border rounded transition-all ${isAssigned ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400' : 'border-green-200 bg-green-50'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-green-900">#{i+1} {sz.name}</h5>
                        <span className="text-xs bg-green-200 text-green-800 font-semibold px-2 py-0.5 rounded">Safety: {sz.safety_score}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 mb-3">
                        <div><strong>District:</strong> {sz.district}</div>
                        <div><strong>Rem. Capacity:</strong> {remaining.toLocaleString()}</div>
                        <div><strong>Healthcare:</strong> {sz.healthcare_access ? 'Available' : 'Limited'}</div>
                        <div><strong>Road Access:</strong> {sz.road_access}</div>
                      </div>
                      {isAssigned ? (
                        <div className="flex gap-2">
                          <button className="flex-1 text-xs font-semibold py-2 rounded bg-emerald-700 text-white cursor-default">
                            ✓ Assigned: {sz.name}
                          </button>
                          <button onClick={handleRemoveRelocation} className="flex-1 text-xs font-semibold py-2 rounded bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer">
                            ✕ Remove Plan
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectRelocation(sz)}
                          className="w-full text-xs font-semibold py-2 rounded transition-colors bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                        >
                          Select for Relocation
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <Disclaimer />
    </div>
  );
}
