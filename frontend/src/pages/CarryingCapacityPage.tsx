import { useState } from 'react';
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
            <RadialBar background dataKey="uv" />
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
}