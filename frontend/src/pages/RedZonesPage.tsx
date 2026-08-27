import { useState } from 'react';
import { seedRedZones } from '../data/seedData';
import { PageHeader, PriorityBadge, CapacityBar, Disclaimer } from '../components/ui';

export default function RedZonesPage() {
  const sorted = [...seedRedZones].sort((a,b) => b.risk_score - a.risk_score);
  const [selected, setSelected] = useState(sorted[0]);

  return (
    <div className="p-6 h-full flex flex-col">
      <PageHeader title="Red Zones" subtitle="High-risk aggregated geographic zones." />
      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 sticky top-0 uppercase text-xs text-slate-500">
              <tr>
                <th className="p-3">Zone ID / Name</th>
                <th className="p-3">Hazard</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Pop Exposed</th>
                <th className="p-3">Priority</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(rz => (
                <tr key={rz.id} onClick={() => setSelected(rz)} className={`cursor-pointer border-b hover:bg-slate-50 ${selected?.id === rz.id ? 'bg-blue-50' : ''}`}>
                  <td className="p-3 font-medium">{rz.id}<br/><span className="text-xs text-slate-500">{rz.name}</span></td>
                  <td className="p-3 capitalize">{rz.hazard_type}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 h-2 rounded-full"><div className="bg-red-500 h-2 rounded-full" style={{width: `${rz.risk_score}%`}}></div></div>
                      {rz.risk_score}
                    </div>
                  </td>
                  <td className="p-3">{rz.population_exposed.toLocaleString()}</td>
                  <td className="p-3"><PriorityBadge priority={rz.relocation_priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-80 bg-white rounded-lg shadow-sm border border-slate-200 p-4 overflow-auto flex-shrink-0">
            <h3 className="font-bold text-lg mb-1">{selected.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{selected.id}</p>
            
            <div className="space-y-4 text-sm">
              <div><strong>Hazard:</strong> <span className="capitalize">{selected.hazard_type}</span></div>
              <div><strong>Risk Score:</strong> {selected.risk_score}</div>
              <div><strong>Pop Exposed:</strong> {selected.population_exposed.toLocaleString()}</div>
              <div><strong>Habitations:</strong> {selected.habitation_count}</div>
              <div>
                <strong>Capacity Stress:</strong> {selected.capacity_stress}%
                <CapacityBar utilization={selected.capacity_stress} status={selected.capacity_stress > 120 ? 'CRITICAL' : 'OVERLOADED'} />
              </div>
              <div><strong>Priority:</strong> <PriorityBadge priority={selected.relocation_priority} /></div>
              <div><strong>Vertices:</strong> {selected.polygon.length} points</div>
            </div>
          </div>
        )}
      </div>
      <Disclaimer />
    </div>
  );
}