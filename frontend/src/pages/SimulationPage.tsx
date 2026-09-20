import { useState } from 'react';
import { seedHabitations } from '../data/seedData';
import { PageHeader, RiskBadge, Disclaimer } from '../components/ui';
import { Sliders, Zap, TrendingUp, TrendingDown } from 'lucide-react';

const PRESETS = [
  { id: 'rain20', label: '20% Rainfall', params: { popChange: 0, rainMulti: 1.2, floodLevel: 0, shelterCap: 0, healthCap: 0, roadAvail: 100 } },
  { id: 'flood', label: 'Major Flood', params: { popChange: 0, rainMulti: 2.0, floodLevel: 4, shelterCap: 0, healthCap: 0, roadAvail: 40 } },
  { id: 'pop', label: '+50% Population', params: { popChange: 50, rainMulti: 1.0, floodLevel: 0, shelterCap: 0, healthCap: 0, roadAvail: 100 } },
  { id: 'shelter', label: '+100% Shelter', params: { popChange: 0, rainMulti: 1.0, floodLevel: 0, shelterCap: 100, healthCap: 50, roadAvail: 100 } },
  { id: 'worst', label: 'Worst Case', params: { popChange: 20, rainMulti: 2.0, floodLevel: 5, shelterCap: 0, healthCap: 0, roadAvail: 30 } },
];

const DEFAULT_PARAMS = { popChange: 0, rainMulti: 1.0, floodLevel: 0, shelterCap: 0, healthCap: 0, roadAvail: 100 };

function getRiskClass(score: number) {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MODERATE';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}

function Delta({ before, after, unit = '', lowerIsBetter = false }: { before: number; after: number; unit?: string; lowerIsBetter?: boolean }) {
  const diff = after - before;
  const worse = lowerIsBetter ? diff < 0 : diff > 0;
  if (diff === 0) return <span className="text-slate-400">—</span>;
  return (
    <span className={`font-bold flex items-center gap-1 ${worse ? 'text-red-600' : 'text-green-600'}`}>
      {worse ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {diff > 0 ? '+' : ''}{Math.round(diff * 10) / 10}{unit}
    </span>
  );
}

export default function SimulationPage() {
  const [selId, setSelId] = useState(seedHabitations[0].id);
  const h = seedHabitations.find(x => x.id === selId) || seedHabitations[0];
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [result, setResult] = useState<any>(null);

  const set = (k: string, v: number) => setParams(p => ({ ...p, [k]: v }));
  const applyPreset = (preset: typeof PRESETS[0]) => setParams(preset.params);
  const reset = () => { setParams(DEFAULT_PARAMS); setResult(null); };

  const runSim = () => {
    const newPop = Math.round(h.population * (1 + params.popChange / 100));
    const floodBonus = params.floodLevel * 3.2;
    const rainBonus = (params.rainMulti - 1) * 9;
    const roadPenalty = (1 - params.roadAvail / 100) * 12;
    const shelterBenefit = params.shelterCap * 0.08;
    const healthBenefit = params.healthCap * 0.04;
    const newRisk = Math.min(100, Math.max(0,
      h.risk_score + floodBonus + rainBonus + roadPenalty - shelterBenefit - healthBenefit
    ));
    const newShelter = Math.max(1, h.shelter_capacity_persons * (1 + params.shelterCap / 100));
    const newCap = Math.min(300, Math.round((newPop * 0.25 / newShelter) * 100 + params.floodLevel * 5));

    setResult({
      before: { risk: h.risk_score, riskClass: h.risk_class, cap: h.capacity_utilization, pop: h.population },
      after: { risk: Math.round(newRisk * 10) / 10, riskClass: getRiskClass(newRisk), cap: newCap, pop: newPop },
    });
  };

  const SLIDERS = [
    { k: 'popChange', label: 'Population Change', min: -50, max: 100, step: 5, fmt: (v: number) => `${v > 0 ? '+' : ''}${v}%` },
    { k: 'rainMulti', label: 'Rainfall Multiplier', min: 0.5, max: 3.0, step: 0.1, fmt: (v: number) => `${v}×` },
    { k: 'floodLevel', label: 'Flood Level', min: 0, max: 5, step: 0.5, fmt: (v: number) => `${v} m` },
    { k: 'shelterCap', label: 'Shelter Capacity Change', min: -50, max: 200, step: 10, fmt: (v: number) => `${v > 0 ? '+' : ''}${v}%` },
    { k: 'healthCap', label: 'Healthcare Capacity Change', min: -50, max: 200, step: 10, fmt: (v: number) => `${v > 0 ? '+' : ''}${v}%` },
    { k: 'roadAvail', label: 'Road Availability', min: 0, max: 100, step: 5, fmt: (v: number) => `${v}%` },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Scenario Simulation"
        subtitle="What-if analysis — model changes in hazard, population, or infrastructure to assess impact on risk."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Sliders className="w-4 h-4" /> Target Habitation</h3>
            <select
              value={selId}
              onChange={e => { setSelId(e.target.value); setResult(null); }}
              className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              {seedHabitations.map(hab => (
                <option key={hab.id} value={hab.id}>
                  {hab.name} — {hab.district} ({hab.risk_class})
                </option>
              ))}
            </select>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
              <div className="bg-slate-50 rounded p-2">
                <div className="font-bold text-lg">{h.risk_score}</div>
                <div className="text-slate-500">Current Risk</div>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <div className="font-bold text-lg">{h.capacity_utilization}%</div>
                <div className="text-slate-500">Capacity</div>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <div className="font-bold text-lg">{h.population.toLocaleString()}</div>
                <div className="text-slate-500">Population</div>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Preset Scenarios</h3>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-blue-100 hover:text-blue-700 border rounded transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
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
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                  <span>{fmt(min)}</span><span>{fmt(max)}</span>
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                onClick={runSim}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded transition-colors"
              >
                Run Simulation
              </button>
              <button onClick={reset} className="px-4 py-2.5 border rounded text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
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