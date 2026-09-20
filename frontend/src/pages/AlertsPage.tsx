import { useState } from 'react';
import { alerts } from '../data/seedData';
import { PageHeader, Disclaimer } from '../components/ui';
import { useHabitations } from '../hooks/useHabitations';
import { useStore } from '../store/useStore';

export default function AlertsPage() {
  const [filter, setFilter] = useState('ALL');
  const { allHabitations } = useHabitations();
  const acknowledgeAlert = useStore(s => s.acknowledgeAlert);
  const acknowledgedAlerts = useStore(s => s.acknowledgedAlerts);

  const dynamicAlerts = allHabitations
    .filter(h => h.risk_class === 'CRITICAL' || h.relocation_priority === 'P1-IMMEDIATE')
    .slice(0, 8)
    .map(h => ({
      id: `DYN-${h.id}`,
      title: `Critical Risk: ${h.name}`,
      message: `${h.name} (${h.district}) has ${h.risk_class} risk (score: ${h.risk_score}) with ${h.capacity_utilization}% capacity stress.`,
      severity: h.risk_score >= 80 ? 'CRITICAL' : 'HIGH',
      recommended_action: h.risk_score >= 80 ? 'Initiate immediate evacuation procedures' : 'Pre-position emergency resources',
      population_affected: h.population,
      timestamp: new Date().toISOString(),
      acknowledged: acknowledgedAlerts.includes(`DYN-${h.id}`),
    }));

  const allAlerts = [...alerts.map(a => ({ ...a, acknowledged: acknowledgedAlerts.includes(a.id) })), ...dynamicAlerts].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const displayed = filter === 'ALL' ? allAlerts : filter === 'CRITICAL' ? allAlerts.filter(a => a.severity === 'CRITICAL') : allAlerts.filter(a => a.severity === 'HIGH');
  
  const criticalCount = allAlerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = allAlerts.filter(a => a.severity === 'HIGH').length;
  const ackCount = acknowledgedAlerts.length;

  return (
    <div className="p-6">
      <PageHeader title="Early Warnings & Alerts" subtitle="Real-time automated risk triggers and notifications." />
      
      <div className="flex gap-4 mb-6">
        <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded text-sm font-bold ${filter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>All ({allAlerts.length})</button>
        <button onClick={() => setFilter('CRITICAL')} className={`px-4 py-2 rounded text-sm font-bold ${filter === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}>Critical ({criticalCount})</button>
        <button onClick={() => setFilter('HIGH')} className={`px-4 py-2 rounded text-sm font-bold ${filter === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800'}`}>High ({highCount})</button>
        <div className="ml-auto flex items-center">
          <span className="text-sm font-bold text-slate-500">Acknowledged: {ackCount}</span>
        </div>
      </div>

      <div className="space-y-4">
        {displayed.map((a: any) => (
          <div key={a.id} className={`p-4 border-l-4 rounded bg-white shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start ${
            a.severity === 'CRITICAL' ? 'border-red-600' : 'border-orange-500'
          } ${a.acknowledged ? 'opacity-60 grayscale' : ''}`}>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`px-2 py-0.5 text-xs font-bold rounded text-white ${
                  a.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-500'
                }`}>{a.severity}</span>
                <span className="text-xs text-slate-500">{new Date(a.timestamp).toLocaleString()}</span>
                {a.acknowledged && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold">ACKNOWLEDGED</span>}
              </div>
              <h3 className="font-bold text-lg mb-1">{a.title}</h3>
              <p className="text-sm text-slate-700 mb-2">{a.message}</p>
              <div className="text-sm bg-slate-50 p-2 rounded inline-block">
                <span className="font-bold">Action:</span> {a.recommended_action}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-bold">{a.population_affected.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mb-2">People at Risk</div>
              <button 
                onClick={() => acknowledgeAlert(a.id)}
                disabled={a.acknowledged}
                className={`text-xs px-3 py-1.5 font-bold rounded ${a.acknowledged ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
              >
                {a.acknowledged ? '✓ Acknowledged' : 'Acknowledge'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <Disclaimer />
    </div>
  );
}
