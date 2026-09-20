import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { seedHabitations } from '../data/seedData';
import { PageHeader, Disclaimer } from '../components/ui';

import { Droplet, Home, HeartPulse, Wheat, Sparkles, RefreshCw } from 'lucide-react';

export default function CarryingCapacityPage() {
  const [sel, setSel] = useState(seedHabitations[0].id);
  const [waterAdj, setWaterAdj] = useState(0); // +/- %
  const [shelterAdj, setShelterAdj] = useState(0); // +/- %
  const [healthAdj, setHealthAdj] = useState(0); // +/- %

  const h = seedHabitations.find(x => x.id === sel) || seedHabitations[0];

  // Dynamically calculate effective capacities considering adjustments
  const effectiveWater = Math.max(1, h.water_capacity_liters_per_day * (1 + waterAdj / 100));
  const effectiveShelter = Math.max(1, h.shelter_capacity_persons * (1 + shelterAdj / 100));
  const effectiveBeds = Math.max(1, h.healthcare_beds * (1 + healthAdj / 100));

  // Minimum required thresholds (NDMA/Disaster baselines)
  const reqWater = h.population * 50; // 50 L/person/day
  const reqShelter = Math.round(h.population * 0.25); // 25% displaced shelter demand
  const reqBeds = Math.max(1, Math.round(h.population / 500)); // 1 bed per 500 people

  // Real utilization ratios (can exceed 100% when stressed/overloaded)
  const waterUtil = Math.round((reqWater / effectiveWater) * 100);
  const shelterUtil = Math.round((reqShelter / effectiveShelter) * 100);
  const healthUtil = Math.round((reqBeds / effectiveBeds) * 100);
  const foodUtil = Math.round((7 / Math.max(0.1, h.food_stock_days)) * 100);
  const sanitationCoverage = h.sanitation_coverage_pct;

  const data = [
    { name: 'Water', label: 'Water Supply', util: waterUtil, req: `${reqWater.toLocaleString()} L/d`, avail: `${Math.round(effectiveWater).toLocaleString()} L/d`, fill: '#2563eb' },
    { name: 'Shelter', label: 'Shelter Capacity', util: shelterUtil, req: `${reqShelter.toLocaleString()} p`, avail: `${Math.round(effectiveShelter).toLocaleString()} p`, fill: '#d97706' },
    { name: 'Health', label: 'Healthcare Beds', util: healthUtil, req: `${reqBeds} beds`, avail: `${Math.round(effectiveBeds)} beds`, fill: '#dc2626' },
    { name: 'Food', label: 'Food Security', util: foodUtil, req: '7 days', avail: `${h.food_stock_days} d`, fill: '#059669' },
    { name: 'Sanitation', label: 'Sanitation', util: Math.round(sanitationCoverage), req: '80% coverage', avail: `${sanitationCoverage}%`, fill: '#7c3aed' },
  ];

  const overallUtil = Math.round((waterUtil + shelterUtil + healthUtil + foodUtil) / 4);
  const overallStatus = overallUtil > 120 ? 'CRITICAL' : overallUtil > 100 ? 'OVERLOADED' : overallUtil > 70 ? 'STRESSED' : 'SAFE';

  const resetAdjustments = () => {
    setWaterAdj(0);
    setShelterAdj(0);
    setHealthAdj(0);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Carrying Capacity Assessment"
        subtitle="Multi-dimensional infrastructure limits, stress thresholds, and real-time capacity simulation."
      />
      
      {/* Habitation Selector & Live Simulator */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="font-semibold text-sm text-slate-700 whitespace-nowrap">Target Habitation:</label>
          <select
            value={sel}
            onChange={e => { setSel(e.target.value); resetAdjustments(); }}
            className="p-2 border rounded-lg text-sm bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500"
          >
            {seedHabitations.map(hab => (
              <option key={hab.id} value={hab.id}>
                {hab.name} — {hab.district}, {hab.state} (Pop: {hab.population.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Population: <strong>{h.population.toLocaleString()}</strong></span>
          <span>•</span>
          <span>Status: <strong className={overallStatus === 'CRITICAL' ? 'text-red-600' : overallStatus === 'OVERLOADED' ? 'text-amber-600' : 'text-emerald-600'}>{overallStatus}</strong></span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Left: Capacity Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Resource Utilization vs Safe Limit (100%)</h3>
              <p className="text-xs text-slate-500">Values above 100% indicate acute deficit and infrastructure failure risk.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-slate-600 mr-2">&lt;70% Safe</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs text-slate-600 mr-2">70-100% Stressed</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-xs text-slate-600">&gt;100% Deficit</span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" domain={[0, 'dataMax + 40']} unit="%" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 600 }} />
                <Tooltip
                  formatter={(val: any, _name: any, item: any) => [
                    `${val}% utilization (Required: ${item.payload.req}, Available: ${item.payload.avail})`,
                    item.payload.label
                  ]}
                />
                <Bar dataKey="util" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => {
                    const color = entry.util > 120 ? '#dc2626' : entry.util > 100 ? '#ea580c' : entry.util > 70 ? '#d97706' : '#16a34a';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Overall Calculated Capacity Stress:</span>
            <span className="font-bold text-sm text-slate-800">{overallUtil}%</span>
          </div>
        </div>

        {/* Right: Live Interactive Adjustments */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800">Dynamic Capacity Intervention</h3>
            </div>
            <button
              onClick={resetAdjustments}
              className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Adjust water tankers, emergency shelter tents, and mobile clinic beds to observe immediate relief on capacity stress.
          </p>

          <div className="space-y-4">
            {/* Water Slider */}
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-blue-600" /> Water Supply: {Math.round(effectiveWater).toLocaleString()} L/d
                </span>
                <span className={`font-mono font-bold ${waterAdj >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                  {waterAdj > 0 ? `+${waterAdj}%` : `${waterAdj}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="200"
                step="10"
                value={waterAdj}
                onChange={e => setWaterAdj(+e.target.value)}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Drought (-50%)</span>
                <span>Baseline</span>
                <span>Emergency Tankers (+200%)</span>
              </div>
            </div>

            {/* Shelter Slider */}
            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-amber-600" /> Shelter Capacity: {Math.round(effectiveShelter).toLocaleString()} persons
                </span>
                <span className={`font-mono font-bold ${shelterAdj >= 0 ? 'text-amber-700' : 'text-red-600'}`}>
                  {shelterAdj > 0 ? `+${shelterAdj}%` : `${shelterAdj}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="200"
                step="10"
                value={shelterAdj}
                onChange={e => setShelterAdj(+e.target.value)}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Damaged (-50%)</span>
                <span>Baseline</span>
                <span>Disaster Camps (+200%)</span>
              </div>
            </div>

            {/* Healthcare Beds Slider */}
            <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-red-600" /> Healthcare Beds: {Math.round(effectiveBeds)} beds
                </span>
                <span className={`font-mono font-bold ${healthAdj >= 0 ? 'text-red-700' : 'text-red-600'}`}>
                  {healthAdj > 0 ? `+${healthAdj}%` : `${healthAdj}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="200"
                step="10"
                value={healthAdj}
                onChange={e => setHealthAdj(+e.target.value)}
                className="w-full accent-red-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Overwhelmed (-50%)</span>
                <span>Baseline</span>
                <span>Field Hospital (+200%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Water Card */}
        <div className={`p-4 bg-white rounded-xl border shadow-sm ${waterUtil > 100 ? 'border-red-200' : 'border-slate-200'}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Droplet className="w-4 h-4" /></span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${waterUtil > 100 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
              {waterUtil}% Util
            </span>
          </div>
          <div className="text-xs text-slate-500">Available vs Required Water</div>
          <div className="text-base font-bold text-slate-900 mt-1">{Math.round(effectiveWater).toLocaleString()} L/d</div>
          <div className="text-xs text-slate-400 mt-0.5">Disaster Need: {reqWater.toLocaleString()} L/d</div>
          <div className="mt-2 text-[11px] text-slate-500">
            {waterUtil > 100 ? `⚠️ Deficit of ${(reqWater - Math.round(effectiveWater)).toLocaleString()} L/day` : '✓ Meets baseline requirements'}
          </div>
        </div>

        {/* Shelter Card */}
        <div className={`p-4 bg-white rounded-xl border shadow-sm ${shelterUtil > 100 ? 'border-amber-200' : 'border-slate-200'}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Home className="w-4 h-4" /></span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${shelterUtil > 100 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {shelterUtil}% Util
            </span>
          </div>
          <div className="text-xs text-slate-500">Displacement Shelter Demand</div>
          <div className="text-base font-bold text-slate-900 mt-1">{Math.round(effectiveShelter).toLocaleString()} persons</div>
          <div className="text-xs text-slate-400 mt-0.5">Displaced Need: {reqShelter.toLocaleString()} persons</div>
          <div className="mt-2 text-[11px] text-slate-500">
            {shelterUtil > 100 ? `⚠️ Shelter overflow by ${(reqShelter - Math.round(effectiveShelter)).toLocaleString()} people` : '✓ Shelter capacity adequate'}
          </div>
        </div>

        {/* Health Card */}
        <div className={`p-4 bg-white rounded-xl border shadow-sm ${healthUtil > 100 ? 'border-red-200' : 'border-slate-200'}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-red-50 text-red-600 rounded-lg"><HeartPulse className="w-4 h-4" /></span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${healthUtil > 100 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {healthUtil}% Util
            </span>
          </div>
          <div className="text-xs text-slate-500">Critical Trauma Beds</div>
          <div className="text-base font-bold text-slate-900 mt-1">{Math.round(effectiveBeds)} beds</div>
          <div className="text-xs text-slate-400 mt-0.5">Est. Emergency Need: {reqBeds} beds</div>
          <div className="mt-2 text-[11px] text-slate-500">
            {healthUtil > 100 ? `⚠️ Medical triage deficit of ${Math.max(0, reqBeds - Math.round(effectiveBeds))} beds` : '✓ Hospital bed capacity sufficient'}
          </div>
        </div>

        {/* Food Stock Card */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Wheat className="w-4 h-4" /></span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${h.food_stock_days < 7 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {h.food_stock_days} Days
            </span>
          </div>
          <div className="text-xs text-slate-500">Emergency Ration Reserves</div>
          <div className="text-base font-bold text-slate-900 mt-1">{h.food_stock_days} days reserve</div>
          <div className="text-xs text-slate-400 mt-0.5">Target Requirement: 7.0 days</div>
          <div className="mt-2 text-[11px] text-slate-500">
            {h.food_stock_days < 7 ? `⚠️ Deficit of ${(7 - h.food_stock_days).toFixed(1)} days food rations` : '✓ Ration stock exceeds 7-day target'}
          </div>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}