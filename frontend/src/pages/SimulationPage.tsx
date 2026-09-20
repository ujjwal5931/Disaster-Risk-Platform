import { useState, useEffect } from 'react';
import { Sliders, Activity } from 'lucide-react';
import { PageHeader, RiskBadge, Disclaimer } from '../components/ui';
import { useHabitations } from '../hooks/useHabitations';

const SLIDERS = [
  { k: 'rain', label: 'Rainfall Intensity (%)', min: 0, max: 200, step: 10, fmt: (v: number) => `+${v}%` },
  { k: 'evac', label: 'Evacuation Rate (%)', min: 0, max: 100, step: 5, fmt: (v: number) => `${v}%` },
  { k: 'infra', label: 'Infra Hardening (Pts)', min: 0, max: 5, step: 1, fmt: (v: number) => `+${v}` },
  { k: 'shelterCap', label: 'Shelter Expansion (%)', min: 0, max: 200, step: 10, fmt: (v: number) => `+${v}%` },
  { k: 'healthCap', label: 'Healthcare Surge (%)', min: 0, max: 100, step: 10, fmt: (v: number) => `+${v}%` },
];

export default function SimulationPage() {
  const { allHabitations } = useHabitations();
  
  const [selId, setSelId] = useState(allHabitations[0]?.id || '');
  useEffect(() => {
    if (!allHabitations.find(h => h.id === selId)) {
      setSelId(allHabitations[0]?.id || '');
    }
  }, [allHabitations, selId]);

  const h = allHabitations.find(x => x.id === selId) || allHabitations[0];

  const [params, setParams] = useState({
    rain: 0, evac: 0, infra: 0, shelterCap: 0, healthCap: 0
  });

  const [result, setResult] = useState<any>(null);

  const set = (k: string, v: number) => setParams(p => ({ ...p, [k]: v }));
  const reset = () => {
    setParams({ rain: 0, evac: 0, infra: 0, shelterCap: 0, healthCap: 0 });
    setResult(null);
  };

  const runSim = () => {
    if (!h) return;
    const basePop = h.population;
    const effPop = Math.max(0, basePop * (1 - (params.evac / 100)));
    
    const hazMultiplier = 1 + (params.rain / 100);
    const newHaz = Math.min(100, h.hazard_severity * hazMultiplier);
    
    const infraImp = params.infra;
    const newVul = Math.max(0, h.housing_quality_index - infraImp);
    
    const simScore = Math.min(100, (newHaz * 0.4) + ((effPop / basePop) * 30) + (newVul * 5) + 10);
    
    const baseCap = h.capacity_utilization;
    const capDenom = 1 + (params.shelterCap / 100 * 0.5) + (params.healthCap / 100 * 0.5);
    const simCap = Math.round((baseCap * (effPop / basePop)) / capDenom);

    const getR = (s: number) => s >= 80 ? 'CRITICAL' : s >= 60 ? 'HIGH' : s >= 40 ? 'MODERATE' : 'LOW';

    setResult({
      before: {
        risk: h.risk_score,
        riskClass: h.risk_class,
        cap: h.capacity_utilization,
        pop: basePop
      },
      after: {
        risk: Math.round(simScore),
        riskClass: getR(simScore),
        cap: simCap,
        pop: Math.round(effPop)
      }
    });
  };

  const Delta = ({before, after, unit = ''}: any) => {
    const d = after - before;
    if (d === 0) return <span className="text-slate-400">0{unit}</span>;
    if (d > 0) return <span className="text-red-500">+{d.toLocaleString()}{unit}</span>;
    return <span className="text-green-600">{d.toLocaleString()}{unit}</span>;
  };

  if (!h) return null;

  return (
    <div className="p-6">
      <PageHeader title="Intervention Simulation" subtitle="Scenario modeling and resource impact forecasting." />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" /> Target Habitation</h3>
            <select 
              value={selId} 
              onChange={e => {setSelId(e.target.value); setResult(null);}}
              className="w-full p-2 border rounded bg-slate-50 font-medium"
            >
              {allHabitations.map(x => (
                <option key={x.id} value={x.id}>{x.name} ({x.district}) - {x.risk_class}</option>
              ))}
            </select>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500 block text-xs">Current Risk</span> <RiskBadge riskClass={h.risk_class} /> ({h.risk_score})</div>
              <div><span className="text-slate-500 block text-xs">Population</span> {h.population.toLocaleString()}</div>
              <div><span className="text-slate-500 block text-xs">Hazard Type</span> <span className="capitalize">{h.hazard_type}</span></div>
              <div><span className="text-slate-500 block text-xs">Capacity Util.</span> {h.capacity_utilization}%</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold">Parameters</h3>
            {SLIDERS.map(({ k, label, min, max, step, fmt }) => (
              <div key={k}>
                <div className="flex justify-between text-sm mb-1">
                  <label className="font-medium text-slate-700">{label}</label>
                  <span className="font-mono text-blue-600 font-bold">{fmt((params as any)[k])}</span>
                </div>
                <input
                  type="range" min={min} max={max} step={step}
                  value={(params as any)[k]}
                  onChange={e => set(k, +e.target.value)}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                  <span>{fmt(min)}</span><span>{fmt(max)}</span>
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                onClick={runSim}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded transition-colors cursor-pointer"
              >
                Run Simulation
              </button>
              <button onClick={reset} className="px-4 py-2.5 border rounded text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {!result ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 border-dashed flex flex-col items-center justify-center text-center min-h-64">
              <Sliders className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-medium text-slate-600">No simulation run yet</h3>
              <p className="text-sm text-slate-400 mt-1">Adjust parameters on the left and click Run Simulation</p>
            </div>
          ) : (
            <>
              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                <h3 className="font-bold mb-4">Before vs After Comparison</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left p-3 font-medium text-slate-600">Metric</th>
                      <th className="text-center p-3 font-medium text-slate-600">Before</th>
                      <th className="text-center p-3 font-medium text-slate-600">After</th>
                      <th className="text-center p-3 font-medium text-slate-600">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-3 font-medium">Risk Score</td>
                      <td className="p-3 text-center">{result.before.risk}</td>
                      <td className="p-3 text-center font-bold text-slate-900">{result.after.risk}</td>
                      <td className="p-3 text-center">
                        <Delta before={result.before.risk} after={result.after.risk} />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Risk Class</td>
                      <td className="p-3 text-center"><RiskBadge riskClass={result.before.riskClass} /></td>
                      <td className="p-3 text-center"><RiskBadge riskClass={result.after.riskClass} /></td>
                      <td className="p-3 text-center">
                        {result.before.riskClass !== result.after.riskClass && (
                          <span className="text-xs text-red-600 font-bold">Changed</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Capacity Util.</td>
                      <td className="p-3 text-center">{result.before.cap}%</td>
                      <td className="p-3 text-center font-bold">{result.after.cap}%</td>
                      <td className="p-3 text-center">
                        <Delta before={result.before.cap} after={result.after.cap} unit="%" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Population</td>
                      <td className="p-3 text-center">{result.before.pop.toLocaleString()}</td>
                      <td className="p-3 text-center font-bold">{result.after.pop.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <Delta before={result.before.pop} after={result.after.pop} />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Shelter Capacity</td>
                      <td className="p-3 text-center">{h.shelter_capacity_persons} p</td>
                      <td className="p-3 text-center font-bold">{Math.round(h.shelter_capacity_persons * (1 + params.shelterCap / 100))} p</td>
                      <td className="p-3 text-center">
                        <Delta before={h.shelter_capacity_persons} after={Math.round(h.shelter_capacity_persons * (1 + params.shelterCap / 100))} unit=" p" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Healthcare Beds</td>
                      <td className="p-3 text-center">{h.healthcare_beds} beds</td>
                      <td className="p-3 text-center font-bold">{Math.round(h.healthcare_beds * (1 + params.healthCap / 100))} beds</td>
                      <td className="p-3 text-center">
                        <Delta before={h.healthcare_beds} after={Math.round(h.healthcare_beds * (1 + params.healthCap / 100))} unit=" beds" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Water Demand</td>
                      <td className="p-3 text-center">{(result.before.pop * 50).toLocaleString()} L/d</td>
                      <td className="p-3 text-center font-bold">{(result.after.pop * 50).toLocaleString()} L/d</td>
                      <td className="p-3 text-center">
                        <Delta before={result.before.pop * 50} after={result.after.pop * 50} unit=" L/d" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={`p-4 rounded-lg border ${
                result.after.risk > result.before.risk + 10 ? 'bg-red-50 border-red-200' :
                result.after.risk < result.before.risk - 10 ? 'bg-green-50 border-green-200' :
                'bg-amber-50 border-amber-200'
              }`}>
                <h4 className="font-bold mb-2 text-sm">Interpretation</h4>
                <p className="text-sm">
                  {result.after.riskClass !== result.before.riskClass
                    ? `⚠️ Risk classification escalated from ${result.before.riskClass} to ${result.after.riskClass}.`
                    : result.after.risk > result.before.risk
                    ? `Risk score increased by ${Math.abs(result.after.risk - result.before.risk).toFixed(1)} points under these conditions.`
                    : `Intervention scenario shows a reduction of ${Math.abs(result.after.risk - result.before.risk).toFixed(1)} risk points.`
                  }
                  {result.after.cap > 120 && ' Carrying capacity is critically overloaded under these conditions.'}
                  {result.after.risk >= 75 && ' Immediate action required.'}
                </p>
              </div>
            </>
          )}
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
