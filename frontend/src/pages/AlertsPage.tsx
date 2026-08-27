import { useState } from 'react';
import { alerts } from '../data/seedData';
import { PageHeader, Disclaimer } from '../components/ui';

export default function AlertsPage() {
  const [tab, setTab] = useState('All');
  const filtered = alerts.filter(a => tab === 'All' || a.severity === tab);

  const colors: Record<string, string> = { CRITICAL: 'border-red-500', HIGH: 'border-orange-500', WARNING: 'border-yellow-500', INFO: 'border-blue-500' };
  const icons: Record<string, string> = { CRITICAL: '🔴', HIGH: '🟠', WARNING: '🟡', INFO: '🔵' };

  return (
    <div className="p-6">
      <PageHeader title="System Alerts" subtitle="Automated warnings and notifications." />
      
      <div className="flex gap-2 mb-6">
        {['All', 'CRITICAL', 'HIGH', 'WARNING'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`px-3 py-1 text-sm border rounded ${tab === t ? 'bg-blue-600 text-white' : 'bg-white'}`}>{t}</button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(a => (
          <div key={a.id} className={`bg-white p-4 rounded shadow-sm border-l-4 flex flex-col md:flex-row gap-4 ${colors[a.severity] || colors.INFO} ${a.acknowledged ? 'opacity-50' : ''}`}>
            <div className="text-2xl pt-1">{icons[a.severity]}</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{a.title}</h3>
              <p className="text-sm text-slate-700 mb-2">{a.message}</p>
              <div className="text-sm bg-slate-100 p-2 rounded mb-2"><strong>Recommended:</strong> {a.recommended_action}</div>
              <div className="text-xs text-slate-400">Pop Affected: {a.population_affected} | {new Date(a.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <button className="px-4 py-2 border rounded text-sm hover:bg-slate-50">{a.acknowledged ? 'Acknowledged' : 'Acknowledge'}</button>
            </div>
          </div>
        ))}
      </div>
      <Disclaimer />
    </div>
  );
}