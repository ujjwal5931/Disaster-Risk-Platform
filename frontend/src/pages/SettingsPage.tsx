import { useState } from 'react';
import { PageHeader, Disclaimer } from '../components/ui';
import { useStore } from '../store/useStore';

const DEFAULT_WEIGHTS = {
  haz: 25,
  pop: 20,
  vul: 15,
  inf: 15,
  hist: 10,
  emerg: 10,
  env: 5
};

export default function SettingsPage() {
  const [w, setW] = useState(DEFAULT_WEIGHTS);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const setRiskWeight = useStore(s => s.setRiskWeight);

  const total = w.haz + w.pop + w.vul + w.inf + w.hist + w.emerg + w.env;

  const handleReset = () => {
    setW(DEFAULT_WEIGHTS);
    setSavedMsg('Weights reset to baseline standard model (25/20/15/15/10/10/5).');
    setTimeout(() => setSavedMsg(null), 4000);
  };

  const handleApply = () => {
    if (total !== 100) return;
    // Persist to store / localStorage for global usage across platform
    localStorage.setItem('drips_custom_weights', JSON.stringify(w));
    Object.entries(w).forEach(([key, val]) => {
      setRiskWeight(key, val / 100);
    });
    setSavedMsg('Custom risk model weights applied successfully! All dashboard and map scores updated.');
    setTimeout(() => setSavedMsg(null), 5000);
  };

  return (
    <div className="p-6 max-w-3xl">
      <PageHeader title="Platform Settings" subtitle="Configure risk model weights and system calibration." />

      {savedMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>✅</span>
            <span>{savedMsg}</span>
          </div>
          <button onClick={() => setSavedMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold ml-4">✕</button>
        </div>
      )}
      
      <div className="bg-white p-6 rounded shadow-sm border mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-slate-800">Risk Weight Configuration</h3>
            <p className="text-xs text-slate-500">Must sum to exactly 100% for mathematical consistency.</p>
          </div>
          <span className={`font-bold px-3 py-1 text-sm rounded ${total === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            Total: {total}%
          </span>
        </div>
        
        <div className="space-y-4 text-sm">
          {[
            {k: 'haz', l: 'Hazard Severity', desc: 'Weight given to flood/landslide intensity'},
            {k: 'pop', l: 'Population Exposure', desc: 'Impact of gross population in danger zone'},
            {k: 'vul', l: 'Vulnerable Population', desc: 'Children, elderly, disabled, and pregnant counts'},
            {k: 'inf', l: 'Infrastructure Vulnerability', desc: 'Housing quality and road materials'},
            {k: 'hist', l: 'Historical Frequency', desc: 'Past disaster recurrences'},
            {k: 'emerg', l: 'Emergency Accessibility', desc: 'Hospital beds and evacuation route clearance'},
            {k: 'env', l: 'Environmental Sensitivity', desc: 'Elevation, slope, and soil type'}
          ].map((item) => (
            <div key={item.k} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="font-medium text-slate-800">{item.l}</span>
                  <span className="text-xs text-slate-400 ml-2">({item.desc})</span>
                </div>
                <span className="font-bold font-mono text-blue-600 w-12 text-right">{(w as any)[item.k]}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={(w as any)[item.k]}
                onChange={e => setW({...w, [item.k]: +e.target.value})}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <button
            onClick={handleReset}
            type="button"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors"
          >
            Reset to Baseline
          </button>
          
          <button
            onClick={handleApply}
            type="button"
            disabled={total !== 100}
            className={`px-6 py-2 rounded-md text-sm font-bold shadow-sm transition-colors ${
              total === 100
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Apply Weights {total !== 100 && `(${total}% / 100%)`}
          </button>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}