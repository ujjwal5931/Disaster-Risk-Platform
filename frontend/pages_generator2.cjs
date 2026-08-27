const fs = require('fs');
const path = require('path');
const srcDir = '/Users/ujjwal/.gemini/antigravity/scratch/disaster-risk-platform/frontend/src/pages';

// 4. RedZonesPage.tsx
fs.writeFileSync(path.join(srcDir, 'RedZonesPage.tsx'), `import { useState } from 'react';
import { seedRedZones } from '../data/seedData';
import { PageHeader, RiskBadge, PriorityBadge, CapacityBar, Disclaimer } from '../components/ui';

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
                <tr key={rz.id} onClick={() => setSelected(rz)} className={\`cursor-pointer border-b hover:bg-slate-50 \${selected?.id === rz.id ? 'bg-blue-50' : ''}\`}>
                  <td className="p-3 font-medium">{rz.id}<br/><span className="text-xs text-slate-500">{rz.name}</span></td>
                  <td className="p-3 capitalize">{rz.hazard_type}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 h-2 rounded-full"><div className="bg-red-500 h-2 rounded-full" style={{width: \`\${rz.risk_score}%\`}}></div></div>
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
}`);

// 5. CarryingCapacityPage.tsx
fs.writeFileSync(path.join(srcDir, 'CarryingCapacityPage.tsx'), `import { useState } from 'react';
import { RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts';
import { seedHabitations } from '../data/seedData';
import { PageHeader, CapacityBar, Disclaimer } from '../components/ui';

export default function CarryingCapacityPage() {
  const [sel, setSel] = useState(seedHabitations[0].id);
  const h = seedHabitations.find(x => x.id === sel) || seedHabitations[0];

  const data = [
    { name: 'Water', uv: Math.min(100, (h.water_capacity_liters_per_day / (h.population*50)) * 100), fill: '#3b82f6' },
    { name: 'Shelter', uv: Math.min(100, (h.shelter_capacity_persons / (h.population*0.25)) * 100), fill: '#f59e0b' },
    { name: 'Health', uv: Math.min(100, (h.healthcare_beds / (h.population/500)) * 100), fill: '#ef4444' },
    { name: 'Food', uv: Math.min(100, (h.food_stock_days / 7) * 100), fill: '#10b981' },
    { name: 'Sanitation', uv: Math.min(100, h.sanitation_coverage_pct), fill: '#8b5cf6' },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Carrying Capacity" subtitle="Infrastructure constraints and limits." />
      
      <div className="mb-6 flex gap-4 items-center">
        <label className="font-medium">Select Habitation:</label>
        <select value={sel} onChange={e=>setSel(e.target.value)} className="p-2 border rounded">
          {seedHabitations.map(hab => (
            <option key={hab.id} value={hab.id}>{hab.name} ({hab.district})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <h3 className="font-bold mb-4">Capacity Utilization (180deg)</h3>
          <RadialBarChart width={400} height={300} cx={200} cy={200} innerRadius={20} outerRadius={140} barSize={10} data={data} startAngle={180} endAngle={0}>
            <RadialBar background clockWise dataKey="uv" />
            <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" wrapperStyle={{top: 0, left: 300, lineHeight: '24px'}} />
            <Tooltip />
          </RadialBarChart>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-bold mb-4">Detailed Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span>Overall Capacity Status</span> <span className="font-bold">{h.capacity_status}</span></div>
              <CapacityBar utilization={h.capacity_utilization} status={h.capacity_status} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
              <div className="p-3 bg-slate-50 border rounded">
                <div className="text-slate-500 mb-1">Water Supply</div>
                <div className="font-bold">{h.water_capacity_liters_per_day.toLocaleString()} L/d</div>
                <div className="text-xs text-slate-500">Req: {(h.population*50).toLocaleString()} L/d</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded">
                <div className="text-slate-500 mb-1">Shelter</div>
                <div className="font-bold">{h.shelter_capacity_persons} persons</div>
                <div className="text-xs text-slate-500">Req: {Math.round(h.population*0.25)} persons</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded">
                <div className="text-slate-500 mb-1">Healthcare Beds</div>
                <div className="font-bold">{h.healthcare_beds} beds</div>
                <div className="text-xs text-slate-500">Req: {Math.round(h.population/500)} beds</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded">
                <div className="text-slate-500 mb-1">Food Stock</div>
                <div className="font-bold">{h.food_stock_days} days</div>
                <div className="text-xs text-slate-500">Req: 7 days</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}`);

// 6. RelocationPage.tsx
fs.writeFileSync(path.join(srcDir, 'RelocationPage.tsx'), `import { useState } from 'react';
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
          <button key={t} onClick={() => {setTab(t); setSel(seedHabitations.filter(h => h.relocation_priority === t)[0]);}} className={\`px-4 py-2 font-medium text-sm border-b-2 transition-colors \${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}\`}>{t}</button>
        ))}
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-1 overflow-auto space-y-4 pr-2">
          {filtered.length === 0 && <div className="text-slate-500">No habitations in this category.</div>}
          {filtered.map(h => (
            <div key={h.id} onClick={()=>setSel(h)} className={\`p-4 bg-white border rounded shadow-sm cursor-pointer hover:border-blue-300 \${sel?.id === h.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}\`}>
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
    </div>
  );
}`);

// 7. HazardAnalysisPage.tsx
fs.writeFileSync(path.join(srcDir, 'HazardAnalysisPage.tsx'), `import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { seedHabitations, hazardEvents } from '../data/seedData';
import { PageHeader, Disclaimer } from '../components/ui';

export default function HazardAnalysisPage() {
  const [tab, setTab] = useState('Overview');

  const hazardCounts = seedHabitations.reduce((acc, h) => {
    acc[h.hazard_type] = (acc[h.hazard_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const barData = Object.keys(hazardCounts).map(k => ({ name: k.toUpperCase(), count: hazardCounts[k] }));

  const radarData = [
    { subject: 'Flood', A: 85, fullMark: 100 },
    { subject: 'Landslide', A: 40, fullMark: 100 },
    { subject: 'Cyclone', A: 20, fullMark: 100 },
    { subject: 'Drought', A: 10, fullMark: 100 },
    { subject: 'Industrial', A: 60, fullMark: 100 },
    { subject: 'Earthquake', A: 50, fullMark: 100 },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Hazard Analysis" subtitle="Multi-hazard profiling and event history." />
      
      <div className="flex border-b mb-6">
        {['Overview', 'Multi-Hazard Profile', 'Event History'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={\`px-4 py-2 font-medium text-sm border-b-2 transition-colors \${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}\`}>{t}</button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        {tab === 'Overview' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {Object.keys(hazardCounts).map(k => (
                <div key={k} className="p-4 border rounded">
                  <div className="font-bold capitalize">{k}</div>
                  <div className="text-2xl">{hazardCounts[k]} <span className="text-sm text-slate-500 font-normal">habitations</span></div>
                </div>
              ))}
            </div>
            <div className="h-64">
              <BarChart width={600} height={250} data={barData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ea580c" />
              </BarChart>
            </div>
          </div>
        )}
        {tab === 'Multi-Hazard Profile' && (
          <div className="flex justify-center">
            <div className="text-center">
              <h3 className="font-bold mb-4">Sample Radar (Rampur)</h3>
              <RadarChart cx={250} cy={200} outerRadius={150} width={500} height={400} data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <Radar name="Risk Score" dataKey="A" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </div>
          </div>
        )}
        {tab === 'Event History' && (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 uppercase text-xs text-slate-500">
              <tr><th className="p-3">Year</th><th className="p-3">Type</th><th className="p-3">Districts</th><th className="p-3">Deaths</th><th className="p-3">Displaced</th></tr>
            </thead>
            <tbody>
              {hazardEvents.map((ev, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3">{ev.year}</td>
                  <td className="p-3 capitalize">{ev.hazard_type}</td>
                  <td className="p-3">{ev.districts}</td>
                  <td className="p-3">{ev.deaths}</td>
                  <td className="p-3">{ev.displaced.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Disclaimer />
    </div>
  );
}`);

// 8. PopulationVulnerabilityPage.tsx
fs.writeFileSync(path.join(srcDir, 'PopulationVulnerabilityPage.tsx'), `import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { seedHabitations } from '../data/seedData';
import { PageHeader, KPICard, Disclaimer } from '../components/ui';

export default function PopulationVulnerabilityPage() {
  const totalPop = seedHabitations.reduce((acc, h) => acc + h.population, 0);
  const totalVul = seedHabitations.reduce((acc, h) => acc + h.children_count + h.elderly_count + h.disabled_count + h.pregnant_women_count, 0);
  
  const sorted = [...seedHabitations].sort((a,b) => (b.children_count+b.elderly_count+b.disabled_count+b.pregnant_women_count) - (a.children_count+a.elderly_count+a.disabled_count+a.pregnant_women_count)).slice(0, 15);
  const chartData = sorted.map(h => ({
    name: h.name,
    Children: h.children_count, Elderly: h.elderly_count, Disabled: h.disabled_count, Pregnant: h.pregnant_women_count
  }));

  return (
    <div className="p-6">
      <PageHeader title="Population Vulnerability" subtitle="Demographic breakdowns and risk exposure." />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Population" value={totalPop} color="blue" />
        <KPICard label="Vulnerable Population" value={totalVul} color="orange" />
        <KPICard label="Vulnerability %" value={((totalVul/totalPop)*100).toFixed(1)+'%'} color="purple" />
        <KPICard label="Highest Vulnerability" value="Bahraich" color="red" sub="District" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
        <h3 className="font-bold mb-4">Top 15 Habitations by Vulnerable Count</h3>
        <div className="h-80 w-full">
          <BarChart width={800} height={300} data={chartData}>
            <XAxis dataKey="name" fontSize={11} angle={-45} textAnchor="end" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Children" stackId="a" fill="#8884d8" />
            <Bar dataKey="Elderly" stackId="a" fill="#82ca9d" />
            <Bar dataKey="Disabled" stackId="a" fill="#ffc658" />
            <Bar dataKey="Pregnant" stackId="a" fill="#ff8042" />
          </BarChart>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}`);

// 9. SimulationPage.tsx
fs.writeFileSync(path.join(srcDir, 'SimulationPage.tsx'), `import { useState } from 'react';
import { seedHabitations } from '../data/seedData';
import { PageHeader, RiskBadge, Disclaimer } from '../components/ui';

export default function SimulationPage() {
  const [sel, setSel] = useState(seedHabitations[0].id);
  const h = seedHabitations.find(x => x.id === sel) || seedHabitations[0];

  const [params, setParams] = useState({
    popChange: 0, rainMulti: 1.0, floodLevel: 0, shelterCap: 0, healthCap: 0, roadAvail: 100
  });

  const [result, setResult] = useState<any>(null);

  const getRiskClass = (score: number) => {
    if (score < 25) return 'LOW';
    if (score < 50) return 'MODERATE';
    if (score < 75) return 'HIGH';
    return 'CRITICAL';
  };

  const runSim = () => {
    const newPop = Math.round(h.population * (1 + params.popChange/100));
    const floodBonus = params.floodLevel * 3;
    const rainBonus = (params.rainMulti - 1) * 8;
    const newShelter = h.shelter_capacity_persons * (1 + params.shelterCap/100);
    const roadPenalty = (1 - params.roadAvail/100) * 10;
    
    const newRisk = Math.min(100, Math.max(0, h.risk_score + floodBonus + rainBonus + roadPenalty - params.shelterCap*0.1 - params.healthCap*0.05));
    const newCap = Math.min(300, (newPop / Math.max(newShelter, 1)) * 25 + (params.floodLevel > 0 ? params.floodLevel * 8 : 0));

    setResult({
      before: { rScore: h.risk_score, rClass: h.risk_class, cap: h.capacity_utilization, pop: h.population },
      after: { rScore: Math.round(newRisk), rClass: getRiskClass(newRisk), cap: Math.round(newCap), pop: newPop }
    });
  };

  return (
    <div className="p-6">
      <PageHeader title="Scenario Simulation" subtitle="What-if analysis for planning and preparedness." />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-bold mb-4">Controls</h3>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium mb-1">Target Habitation</label>
              <select value={sel} onChange={e=>setSel(e.target.value)} className="w-full p-2 border rounded">
                {seedHabitations.map(hab => <option key={hab.id} value={hab.id}>{hab.name}</option>)}
              </select>
            </div>
            
            <div className="pt-2"><label className="block font-medium mb-1">Population Change: {params.popChange}%</label>
            <input type="range" min="-50" max="100" step="5" value={params.popChange} onChange={e=>setParams({...params, popChange: +e.target.value})} className="w-full" /></div>
            
            <div className="pt-2"><label className="block font-medium mb-1">Rainfall Multiplier: {params.rainMulti}x</label>
            <input type="range" min="0.5" max="3.0" step="0.1" value={params.rainMulti} onChange={e=>setParams({...params, rainMulti: +e.target.value})} className="w-full" /></div>
            
            <div className="pt-2"><label className="block font-medium mb-1">Flood Level: {params.floodLevel}m</label>
            <input type="range" min="0" max="5" step="0.5" value={params.floodLevel} onChange={e=>setParams({...params, floodLevel: +e.target.value})} className="w-full" /></div>
            
            <div className="pt-2"><label className="block font-medium mb-1">Road Availability: {params.roadAvail}%</label>
            <input type="range" min="0" max="100" step="5" value={params.roadAvail} onChange={e=>setParams({...params, roadAvail: +e.target.value})} className="w-full" /></div>
            
            <button onClick={runSim} className="w-full bg-blue-600 text-white font-bold py-2 rounded mt-4 hover:bg-blue-700">Run Simulation</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-bold mb-4">Results</h3>
          {result ? (
            <div className="space-y-6">
              <table className="w-full text-sm text-left border">
                <thead className="bg-slate-50 border-b">
                  <tr><th className="p-3">Metric</th><th className="p-3">Before</th><th className="p-3">After</th><th className="p-3">Change</th></tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Risk Score</td>
                    <td className="p-3">{result.before.rScore}</td>
                    <td className="p-3 font-bold text-slate-800">{result.after.rScore}</td>
                    <td className="p-3 text-red-600 font-bold">{result.after.rScore > result.before.rScore ? '↑' : '↓'} {Math.abs(result.after.rScore - result.before.rScore)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Risk Class</td>
                    <td className="p-3"><RiskBadge riskClass={result.before.rClass} /></td>
                    <td className="p-3"><RiskBadge riskClass={result.after.rClass} /></td>
                    <td className="p-3"></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Capacity Util</td>
                    <td className="p-3">{result.before.cap}%</td>
                    <td className="p-3 font-bold text-slate-800">{result.after.cap}%</td>
                    <td className="p-3 text-red-600 font-bold">{result.after.cap > result.before.cap ? '↑' : '↓'} {Math.abs(result.after.cap - result.before.cap)}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Population</td>
                    <td className="p-3">{result.before.pop}</td>
                    <td className="p-3">{result.after.pop}</td>
                    <td className="p-3"></td>
                  </tr>
                </tbody>
              </table>
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-sm">
                <strong>Interpretation:</strong> The simulated parameters lead to a {result.after.rScore > result.before.rScore ? 'significant increase' : 'decrease'} in risk. Review capacity stress and consider pre-emptive relocation.
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-sm italic h-full flex items-center justify-center">Adjust parameters and click Run Simulation.</div>
          )}
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}`);

// 10. AlertsPage.tsx
fs.writeFileSync(path.join(srcDir, 'AlertsPage.tsx'), `import { useState } from 'react';
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
          <button key={t} onClick={()=>setTab(t)} className={\`px-3 py-1 text-sm border rounded \${tab === t ? 'bg-blue-600 text-white' : 'bg-white'}\`}>{t}</button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(a => (
          <div key={a.id} className={\`bg-white p-4 rounded shadow-sm border-l-4 flex flex-col md:flex-row gap-4 \${colors[a.severity] || colors.INFO} \${a.acknowledged ? 'opacity-50' : ''}\`}>
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
}`);

// 11. HistoricalAnalysisPage.tsx
fs.writeFileSync(path.join(srcDir, 'HistoricalAnalysisPage.tsx'), `import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { hazardEvents } from '../data/seedData';
import { PageHeader, Disclaimer } from '../components/ui';

export default function HistoricalAnalysisPage() {
  const chartData = [
    { year: 2018, Flood: 1, Industrial: 1 },
    { year: 2019, Cyclone: 1, Flood: 1 },
    { year: 2020, Flood: 1, Cyclone: 1 },
    { year: 2021, Landslide: 2 },
    { year: 2022, Drought: 1, Flood: 1 },
    { year: 2023, Cyclone: 1 },
    { year: 2024, Flood: 1 },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Historical Analysis" subtitle="Past event tracking and pattern recognition." />
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
        <h3 className="font-bold mb-4">Events per Year</h3>
        <div className="h-64">
          <BarChart width={800} height={250} data={chartData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Flood" stackId="a" fill="#3b82f6" />
            <Bar dataKey="Cyclone" stackId="a" fill="#10b981" />
            <Bar dataKey="Landslide" stackId="a" fill="#ea580c" />
            <Bar dataKey="Drought" stackId="a" fill="#f59e0b" />
            <Bar dataKey="Industrial" stackId="a" fill="#8b5cf6" />
          </BarChart>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}`);

// 12. DataUploadPage.tsx
fs.writeFileSync(path.join(srcDir, 'DataUploadPage.tsx'), `import { PageHeader, Disclaimer } from '../components/ui';

export default function DataUploadPage() {
  return (
    <div className="p-6">
      <PageHeader title="Data Upload" subtitle="Ingest new geospatial and demographic data." />
      
      <div className="bg-white p-12 border-2 border-dashed border-slate-300 rounded-lg text-center mb-6 hover:bg-slate-50 transition-colors cursor-pointer">
        <div className="text-4xl mb-4">📁</div>
        <h3 className="font-bold text-lg">Click to upload or drag & drop</h3>
        <p className="text-slate-500 text-sm mt-2">Supports .csv, .json, .geojson (Max 50MB)</p>
      </div>

      <div className="bg-slate-50 p-4 rounded border text-sm">
        <h4 className="font-bold mb-2">Required CSV Columns:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-600">
          <div>id</div><div>name</div><div>district</div><div>state</div>
          <div>latitude</div><div>longitude</div><div>population</div><div>hazard_type</div>
          <div>water_capacity...</div><div>shelter_capacity...</div><div>healthcare_beds</div><div>...</div>
        </div>
        <button className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded font-medium">Download Template CSV</button>
      </div>
      <Disclaimer />
    </div>
  );
}`);

// 13. ReportsPage.tsx
fs.writeFileSync(path.join(srcDir, 'ReportsPage.tsx'), `import { PageHeader, Disclaimer } from '../components/ui';

export default function ReportsPage() {
  return (
    <div className="p-6">
      <PageHeader title="Report Generator" subtitle="Exportable PDF and print reports." />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded shadow-sm border col-span-1 space-y-4">
          <h3 className="font-bold border-b pb-2">Options</h3>
          <div><label className="block text-sm font-medium mb-1">Report Type</label>
          <select className="w-full p-2 border rounded text-sm"><option>Habitation Report</option><option>Regional Summary</option></select></div>
          <div><label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Executive Summary</label></div>
          <div><label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Hazard Analysis</label></div>
          <div><label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Relocation Plan</label></div>
          <button onClick={() => window.print()} className="w-full bg-blue-600 text-white py-2 rounded text-sm font-bold">Print Report</button>
        </div>
        <div className="bg-white p-8 rounded shadow-sm border col-span-3 min-h-[500px]">
          <h1 className="text-2xl font-bold mb-2">Disaster Risk Intelligence Report</h1>
          <p className="text-slate-500 mb-6">Generated on: {new Date().toLocaleDateString()}</p>
          <hr className="mb-6" />
          <h2 className="text-xl font-bold mb-3">Executive Summary</h2>
          <p className="text-sm text-slate-700 leading-relaxed">This report outlines the current risk profile and carrying capacity constraints for the selected region. Analysis indicates critical stress points in flood-prone areas, necessitating immediate intervention and pre-emptive relocation planning.</p>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}`);

// 14. SettingsPage.tsx
fs.writeFileSync(path.join(srcDir, 'SettingsPage.tsx'), `import { useState } from 'react';
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
          <span className={\`font-bold px-3 py-1 rounded \${total === 100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}\`}>Total: {total}%</span>
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
}`);
