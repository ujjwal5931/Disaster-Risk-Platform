import { useState } from 'react';
import { seedHabitations, seedSafeZones } from '../data/seedData';
import { PageHeader, RiskBadge, PriorityBadge, Disclaimer } from '../components/ui';

export default function RelocationPage() {
  const [tab, setTab] = useState('P1-IMMEDIATE');
  const filtered = seedHabitations.filter(h => h.relocation_priority === tab);
  const [sel, setSel] = useState(filtered[0] || null);

  const TABS = ['P1-IMMEDIATE', 'P2-URGENT', 'P3-PLANNED', 'P4-MONITOR'];

  return (
    <div className="p-6 h-full flex flex-col">
      <PageHeader title="Relocation Logistics" subtitle="Manage and prioritize relocations to safe zones." />
      
      <div className="flex border-b mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => {setTab(t); setSel(seedHabitations.filter(h => h.relocation_priority === t)[0]);}} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t}</button>
        ))}
      </div>

      <div className="flex-1 flex gap-6 min-h-0 mb-6">
        <div className="flex-1 overflow-auto space-y-4 pr-2">
          {filtered.length === 0 && <div className="text-slate-500">No habitations in this category.</div>}
          {filtered.map(h => (
            <div key={h.id} onClick={()=>setSel(h)} className={`p-4 bg-white border rounded shadow-sm cursor-pointer hover:border-blue-300 ${sel?.id === h.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold">{h.name}</h3>
                <RiskBadge riskClass={h.risk_class} />
              </div>
              <p className="text-sm text-slate-500 mb-2">{h.district}</p>
              <div className="flex gap-4 text-sm">
                <div><strong>Pop:</strong> {h.population}</div>
                <div><strong>Cap:</strong> {h.capacity_utilization}%</div>
              </div>
            </div>
          ))}
        </div>

        {sel && (
          <div className="w-[400px] bg-white border rounded shadow-sm flex flex-col flex-shrink-0">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-bold text-lg mb-1">{sel.name} Details</h3>
              <PriorityBadge priority={sel.relocation_priority} />
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <h4 className="font-bold mb-3">Top 3 Recommended Safe Zones</h4>
              <div className="space-y-4">
                {seedSafeZones.slice(0,3).map((sz, i) => (
                  <div key={sz.id} className="p-3 border rounded border-green-200 bg-green-50">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-green-800">#{i+1} {sz.name}</h5>
                      <span className="text-xs bg-green-200 text-green-800 px-1 rounded">Score: {sz.safety_score}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                      <div><strong>Distance:</strong> ~{(Math.random()*100).toFixed(1)} km</div>
                      <div><strong>Capacity:</strong> {sz.available_capacity}</div>
                      <div><strong>Healthcare:</strong> {sz.healthcare_access}</div>
                      <div><strong>Roads:</strong> {sz.road_access}</div>
                    </div>
                    <button className="w-full mt-3 bg-green-600 text-white text-xs py-1.5 rounded hover:bg-green-700">Select for Relocation</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Disclaimer />
    </div>
  );
}