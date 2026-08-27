import { useState } from 'react';
import { PageHeader, Disclaimer } from '../components/ui';

export default function SettingsPage() {
  const [w, setW] = useState({ haz: 25, pop: 20, vul: 15, inf: 15, hist: 10, emerg: 10, env: 5 });
  const total = w.haz + w.pop + w.vul + w.inf + w.hist + w.emerg + w.env;

  return (
    <div className="p-6 max-w-3xl">
      <PageHeader title="Platform Settings" subtitle="Configure risk model weights." />
      
      <div className="bg-white p-6 rounded shadow-sm border mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold">Risk Weight Configuration</h3>
          <span className={`font-bold px-3 py-1 rounded ${total === 100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>Total: {total}%</span>
        </div>
        
        <div className="space-y-4 text-sm">
          {[
            {k: 'haz', l: 'Hazard Severity'}, {k: 'pop', l: 'Population Exposure'}, {k: 'vul', l: 'Vulnerable Population'},
            {k: 'inf', l: 'Infrastructure'}, {k: 'hist', l: 'Historical Frequency'}, {k: 'emerg', l: 'Emergency Accessibility'}, {k: 'env', l: 'Environmental Sensitivity'}
          ].map((item) => (
            <div key={item.k} className="flex items-center gap-4">
              <label className="w-48">{item.l}</label>
              <input type="range" min="0" max="100" value={(w as any)[item.k]} onChange={e => setW({...w, [item.k]: +e.target.value})} className="flex-1" />
              <span className="w-12 text-right">{(w as any)[item.k]}%</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-4">
          <button className="bg-slate-200 px-4 py-2 rounded text-sm">Reset</button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold" disabled={total !== 100}>Apply Weights</button>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}