const fs = require('fs');
const path = require('path');

const srcDir = '/Users/ujjwal/.gemini/antigravity/scratch/disaster-risk-platform/frontend/src/pages';
const mkdir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
mkdir(srcDir);

// 1. DashboardPage.tsx
fs.writeFileSync(path.join(srcDir, 'DashboardPage.tsx'), `import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { PageHeader, KPICard, Disclaimer, RiskBadge, PriorityBadge } from '../components/ui';
import { seedHabitations, alerts } from '../data/seedData';
import { getRiskHexColor } from '../utils/riskColors';

export default function DashboardPage() {
  const totalHabs = seedHabitations.length;
  const highRisk = seedHabitations.filter(h => h.risk_class === 'HIGH').length;
  const criticalRisk = seedHabitations.filter(h => h.risk_class === 'CRITICAL').length;
  const capExceeded = seedHabitations.filter(h => h.capacity_utilization > 100).length;
  const immediateP1 = seedHabitations.filter(h => h.relocation_priority === 'P1-IMMEDIATE').length;
  const popAtRisk = seedHabitations.filter(h => h.risk_class === 'HIGH' || h.risk_class === 'CRITICAL')
    .reduce((acc, h) => acc + h.population, 0);

  const pieData = [
    { name: 'CRITICAL', value: criticalRisk },
    { name: 'HIGH', value: highRisk },
    { name: 'MODERATE', value: seedHabitations.filter(h => h.risk_class === 'MODERATE').length },
    { name: 'LOW', value: seedHabitations.filter(h => h.risk_class === 'LOW').length },
  ];

  const hazards = seedHabitations.reduce((acc, h) => {
    acc[h.hazard_type] = (acc[h.hazard_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const barData = Object.keys(hazards).map(k => ({ name: k.toUpperCase(), count: hazards[k] }));

  const top10 = [...seedHabitations].sort((a, b) => b.risk_score - a.risk_score).slice(0, 10);
  const recentAlerts = alerts.slice(0, 4);

  return (
    <div className="p-6">
      <PageHeader title="Platform Dashboard" subtitle="Overview of current risk intelligence." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <KPICard label="Total Habitations" value={totalHabs} color="blue" />
        <KPICard label="High Risk" value={highRisk} color="orange" />
        <KPICard label="Critical" value={criticalRisk} color="red" />
        <KPICard label="Capacity >100%" value={capExceeded} color="yellow" />
        <KPICard label="P1 Relocation" value={immediateP1} color="purple" />
        <KPICard label="Pop at Risk" value={popAtRisk} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 lg:col-span-1">
          <h3 className="font-semibold text-sm mb-4">Risk Distribution</h3>
          <div className="h-64 flex justify-center">
            <PieChart width={250} height={250}>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={\`cell-\${index}\`} fill={getRiskHexColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4">Hazards</h3>
          <div className="h-64">
            <BarChart width={500} height={250} data={barData}>
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 xl:col-span-2">
          <h3 className="font-semibold text-sm mb-4">Top 10 Priority Habitations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr><th>Name</th><th>District</th><th>Risk Class</th><th>Priority</th><th>Action</th></tr>
              </thead>
              <tbody>
                {top10.map(h => (
                  <tr key={h.id} className="border-b">
                    <td className="py-2">{h.name}</td>
                    <td>{h.district}</td>
                    <td><RiskBadge riskClass={h.risk_class} /></td>
                    <td><PriorityBadge priority={h.relocation_priority} /></td>
                    <td><Link to={\`/habitation/\${h.id}\`} className="text-blue-600 hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-semibold text-sm mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {recentAlerts.map(a => (
              <div key={a.id} className="border-l-4 p-3 bg-slate-50 text-sm" style={{ borderColor: a.severity === 'CRITICAL' ? 'red' : 'orange' }}>
                <div className="font-semibold">{a.title}</div>
                <div className="text-slate-600 mt-1">{a.message}</div>
                <div className="text-xs text-slate-400 mt-2">{new Date(a.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}`);

// 2. RiskMapPage.tsx
fs.writeFileSync(path.join(srcDir, 'RiskMapPage.tsx'), `import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { seedHabitations, seedRedZones, seedSafeZones } from '../data/seedData';
import { getRiskHexColor } from '../utils/riskColors';
import { RiskBadge, PriorityBadge } from '../components/ui';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const getCircleIcon = (color: string) => L.divIcon({
  html: \`<div style="background-color: \${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>\`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const getDiamondIcon = () => L.divIcon({
  html: \`<div style="background-color: #10b981; width: 16px; height: 16px; transform: rotate(45deg); border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>\`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function RiskMapPage() {
  const [showHabs, setShowHabs] = useState(true);
  const [showRedZones, setShowRedZones] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filteredHabs = seedHabitations.filter(h => riskFilter === 'ALL' || h.risk_class === riskFilter);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded shadow-md w-64">
        <h3 className="font-bold mb-3">Map Layers</h3>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={showHabs} onChange={e=>setShowHabs(e.target.checked)} /> Habitations</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={showRedZones} onChange={e=>setShowRedZones(e.target.checked)} /> Red Zones</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={showSafeZones} onChange={e=>setShowSafeZones(e.target.checked)} /> Safe Zones</label>
          <hr className="my-2" />
          <select value={riskFilter} onChange={e=>setRiskFilter(e.target.value)} className="w-full p-1 border rounded text-sm">
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MODERATE">Moderate Only</option>
            <option value="LOW">Low Only</option>
          </select>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-[1000] bg-white p-3 rounded shadow-md text-xs">
        <h4 className="font-bold mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#dc2626]"></span> Critical Risk</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ea580c]"></span> High Risk</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ca8a04]"></span> Moderate Risk</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#16a34a]"></span> Low Risk</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rotate-45 bg-[#10b981]"></span> Safe Zone</div>
          <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-500 opacity-30 border border-red-500"></span> Red Zone Polygon</div>
        </div>
      </div>

      <MapContainer center={[22.5, 82]} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        
        {showHabs && filteredHabs.map(h => (
          <Marker key={h.id} position={[h.latitude, h.longitude]} icon={getCircleIcon(getRiskHexColor(h.risk_class))}>
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-lg">{h.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{h.district}, {h.state}</p>
                <div className="flex gap-2 mb-2"><RiskBadge riskClass={h.risk_class} /><PriorityBadge priority={h.relocation_priority} /></div>
                <div className="text-sm space-y-1 mb-3">
                  <div><strong>Pop:</strong> {h.population.toLocaleString()}</div>
                  <div><strong>Hazard:</strong> <span className="capitalize">{h.hazard_type}</span></div>
                  <div><strong>Capacity:</strong> {h.capacity_utilization}%</div>
                </div>
                <Link to={\`/habitation/\${h.id}\`} className="text-blue-600 hover:underline text-sm font-medium">View Details →</Link>
              </div>
            </Popup>
          </Marker>
        ))}

        {showRedZones && seedRedZones.map(rz => (
          <Polygon key={rz.id} positions={rz.polygon as [number, number][]} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.25 }}>
            <Popup>
              <div><h3 className="font-bold">{rz.name}</h3><p className="text-sm">Exposed: {rz.population_exposed}</p></div>
            </Popup>
          </Polygon>
        ))}

        {showSafeZones && seedSafeZones.map(sz => (
          <Marker key={sz.id} position={[sz.latitude, sz.longitude]} icon={getDiamondIcon()}>
            <Popup>
              <div><h3 className="font-bold">{sz.name}</h3><p className="text-sm">Capacity: {sz.available_capacity}</p></div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}`);

// 3. HabitationDetailPage.tsx
fs.writeFileSync(path.join(srcDir, 'HabitationDetailPage.tsx'), `import { useState } from 'react';
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
          <PageHeader title={h.name} subtitle={\`\${h.district}, \${h.state}\`} />
          <div className="flex gap-2"><RiskBadge riskClass={h.risk_class} /><PriorityBadge priority={h.relocation_priority} /></div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{h.risk_score}/100</div>
          <div className="text-sm text-slate-500">Risk Score</div>
        </div>
      </div>

      <div className="flex border-b mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={\`px-4 py-2 font-medium text-sm border-b-2 transition-colors \${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}\`}>{t}</button>
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
}`);

