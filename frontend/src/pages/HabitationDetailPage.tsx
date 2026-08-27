import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { seedHabitations, seedSafeZones } from '../data/seedData';
import { PageHeader, RiskBadge, PriorityBadge, CapacityBar, Disclaimer } from '../components/ui';

export default function HabitationDetailPage() {
  const { id } = useParams();
  const h = seedHabitations.find(x => x.id === id) || seedHabitations[0];
  const [tab, setTab] = useState('Overview');

  // Simple haversine
  const dist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const nearestZones = [...seedSafeZones].map(sz => ({
    ...sz,
    distance_km: dist(h.latitude, h.longitude, sz.latitude, sz.longitude)
  })).sort((a,b) => a.distance_km - b.distance_km).slice(0, 3);

  const popData = [{ name: 'Vulnerable', children: h.children_count, elderly: h.elderly_count, disabled: h.disabled_count, pregnant: h.pregnant_women_count }];

  const TABS = ['Overview', 'Population', 'Capacity', 'Relocation', 'Actions'];

  return (
    <div className="p-6">
      <Link to="/map" className="flex items-center gap-2 text-sm text-blue-600 mb-4 hover:underline"><ArrowLeft className="w-4 h-4"/> Back to Map</Link>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6 flex justify-between items-start">
        <div>
          <PageHeader title={h.name} subtitle={`${h.district}, ${h.state}`} />
          <div className="flex gap-2"><RiskBadge riskClass={h.risk_class} /><PriorityBadge priority={h.relocation_priority} /></div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{h.risk_score}/100</div>
          <div className="text-sm text-slate-500">Risk Score</div>
        </div>
      </div>

      <div className="flex border-b mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t}</button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
        {tab === 'Overview' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-900">{h.explanation}</div>
            <div>
              <h3 className="font-bold mb-3">Key Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Hazard Type:</strong> <span className="capitalize">{h.hazard_type}</span></div>
                <div><strong>Total Population:</strong> {h.population}</div>
                <div><strong>Elevation:</strong> {h.elevation}m</div>
                <div><strong>Primary Hazard:</strong> {h.primary_hazard}</div>
              </div>
            </div>
          </div>
        )}
        {tab === 'Population' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded"><strong>Children:</strong> {h.children_count}</div>
              <div className="p-3 bg-slate-50 rounded"><strong>Elderly:</strong> {h.elderly_count}</div>
              <div className="p-3 bg-slate-50 rounded"><strong>Disabled:</strong> {h.disabled_count}</div>
              <div className="p-3 bg-slate-50 rounded"><strong>Pregnant:</strong> {h.pregnant_women_count}</div>
            </div>
            <div className="h-64">
              <BarChart width={500} height={250} data={popData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="children" stackId="a" fill="#8884d8" />
                <Bar dataKey="elderly" stackId="a" fill="#82ca9d" />
                <Bar dataKey="disabled" stackId="a" fill="#ffc658" />
                <Bar dataKey="pregnant" stackId="a" fill="#ff8042" />
              </BarChart>
            </div>
          </div>
        )}
        {tab === 'Capacity' && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1"><span>Overall Capacity Utilization</span><span>{h.capacity_utilization}%</span></div>
              <CapacityBar utilization={h.capacity_utilization} status={h.capacity_status} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div><strong>Water Capacity:</strong> {h.water_capacity_liters_per_day} L/day</div>
              <div><strong>Shelter Capacity:</strong> {h.shelter_capacity_persons} persons</div>
              <div><strong>Healthcare Beds:</strong> {h.healthcare_beds}</div>
              <div><strong>Food Stock:</strong> {h.food_stock_days} days</div>
            </div>
          </div>
        )}
        {tab === 'Relocation' && (
          <div className="space-y-6">
            <h3 className="font-bold">Nearest Safe Zones</h3>
            <div className="space-y-4">
              {nearestZones.map((sz, i) => (
                <div key={sz.id} className="p-4 border rounded shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-green-700">#{i+1} {sz.name}</h4>
                      <p className="text-sm text-slate-600">Distance: {sz.distance_km.toFixed(1)} km</p>
                    </div>
                    <div className="text-right text-sm">
                      <div>Safety Score: <strong>{sz.safety_score}</strong></div>
                      <div>Capacity: <strong>{sz.available_capacity}</strong></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'Actions' && (
          <div className="space-y-4">
            <h3 className="font-bold">Recommended Actions</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              {h.recommended_actions.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Disclaimer />
    </div>
  );
}