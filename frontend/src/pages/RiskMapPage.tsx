import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip as LeafletTooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { seedRedZones, seedSafeZones } from '../data/seedData';
import { getRiskHexColor } from '../utils/riskColors';
import { RiskBadge, PriorityBadge } from '../components/ui';
import { useHabitations } from '../hooks/useHabitations';
import { useStore } from '../store/useStore';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Habitation circle: size-encoded by population
const getHabitationIcon = (color: string, population: number, isRelocated: boolean) => {
  const size = isRelocated ? 14 : Math.max(12, Math.min(28, Math.round(Math.sqrt(population / 200))));
  const border = isRelocated ? '#10b981' : 'white';
  const opacity = isRelocated ? 0.5 : 1;
  const inner = isRelocated
    ? `<div style="position:absolute;top:-1px;right:-1px;font-size:8px;line-height:1;">✓</div>`
    : '';
  return L.divIcon({
    html: `<div style="position:relative;background-color:${color};opacity:${opacity};width:${size}px;height:${size}px;border-radius:50%;border:2.5px solid ${border};box-shadow:0 0 5px rgba(0,0,0,0.4);">${inner}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Safe zone: green diamond
const getSafeZoneIcon = () => L.divIcon({
  html: `<div style="background-color:#10b981;width:14px;height:14px;transform:rotate(45deg);border:2.5px solid white;box-shadow:0 0 5px rgba(0,0,0,0.4);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Red zone center label marker
const getRedZoneLabelIcon = (name: string) => L.divIcon({
  html: `<div style="background:rgba(185,28,28,0.9);color:white;font-size:10px;font-weight:700;padding:2px 5px;border-radius:4px;white-space:nowrap;border:1px solid #7f1d1d;box-shadow:0 1px 4px rgba(0,0,0,0.4);">⚠ ${name}</div>`,
  className: '',
  iconSize: undefined as any,
  iconAnchor: [0, 0],
});

// Compute centroid of polygon
function centroid(positions: [number, number][]): [number, number] {
  const lat = positions.reduce((s, p) => s + p[0], 0) / positions.length;
  const lng = positions.reduce((s, p) => s + p[1], 0) / positions.length;
  return [lat, lng];
}

export default function RiskMapPage() {
  const { allHabitations, relocatedIds } = useHabitations();
  const relocationPlans = useStore(s => s.relocationPlans);

  const [showHabs, setShowHabs] = useState(true);
  const [showRedZones, setShowRedZones] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showRelocated, setShowRelocated] = useState(true);
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filteredHabs = allHabitations.filter(h => {
    if (!showRelocated && relocatedIds.has(h.id)) return false;
    return riskFilter === 'ALL' || h.risk_class === riskFilter;
  });

  return (
    <div className="relative w-full h-full">
      {/* Controls panel */}
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-xl shadow-md w-64 border border-slate-200">
        <h3 className="font-bold mb-3 text-slate-800">Map Layers</h3>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showHabs} onChange={e => setShowHabs(e.target.checked)} className="accent-blue-600" />
            <span>Habitations <span className="text-xs text-slate-400">({allHabitations.length})</span></span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showRelocated} onChange={e => setShowRelocated(e.target.checked)} className="accent-emerald-600" />
            <span>Show Relocated <span className="text-xs text-slate-400">({relocatedIds.size})</span></span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showRedZones} onChange={e => setShowRedZones(e.target.checked)} className="accent-red-600" />
            <span>Red Zones <span className="text-xs text-slate-400">({seedRedZones.length})</span></span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showSafeZones} onChange={e => setShowSafeZones(e.target.checked)} className="accent-emerald-600" />
            <span>Safe Zones <span className="text-xs text-slate-400">({seedSafeZones.length})</span></span>
          </label>
          <hr className="my-2 border-slate-200" />
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="w-full p-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">⛔ Critical Only</option>
            <option value="HIGH">🔴 High Only</option>
            <option value="MODERATE">🟡 Moderate Only</option>
            <option value="LOW">🟢 Low Only</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 right-4 z-[1000] bg-white p-3 rounded-xl shadow-md text-xs border border-slate-200 min-w-[170px]">
        <h4 className="font-bold mb-2 text-slate-700">Legend</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#dc2626] border border-white shadow-sm inline-block" /> Critical Risk</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ea580c] border border-white shadow-sm inline-block" /> High Risk</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#ca8a04] border border-white shadow-sm inline-block" /> Moderate Risk</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#16a34a] border border-white shadow-sm inline-block" /> Low Risk</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#6ee7b7] border-2 border-emerald-500 inline-block" />✓ Relocated</div>
          <hr className="border-slate-200" />
          <div className="flex items-center gap-2"><span className="w-3 h-3 rotate-45 bg-[#10b981] border border-white shadow-sm inline-block" /> Safe Zone</div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-3 bg-red-200 border-2 border-dashed border-red-700 inline-block rounded-sm" />
            <span>Red Zone Area</span>
          </div>
          <div className="text-slate-400 mt-1">Circle size ∝ population</div>
        </div>
      </div>

      <MapContainer center={[22.5, 82]} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

        {/* Red Zones — thick dashed polygons with label */}
        {showRedZones && seedRedZones.map(rz => {
          const positions = rz.polygon as [number, number][];
          const center = centroid(positions);
          return (
            <div key={rz.id}>
              <Polygon
                positions={positions}
                pathOptions={{
                  color: '#b91c1c',
                  weight: 3,
                  dashArray: '8, 5',
                  fillColor: '#ef4444',
                  fillOpacity: 0.12,
                  opacity: 0.9,
                }}
              >
                <LeafletTooltip sticky>
                  <strong>{rz.name}</strong><br />
                  Exposed: {rz.population_exposed?.toLocaleString()}<br />
                  Risk: {rz.risk_score} | Priority: {rz.relocation_priority}
                </LeafletTooltip>
                <Popup>
                  <div className="min-w-[180px]">
                    <h3 className="font-bold text-red-800 mb-1">⚠ {rz.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">Red Zone · {rz.hazard_type}</p>
                    <div className="text-sm space-y-1">
                      <div><strong>Risk Score:</strong> {rz.risk_score}/100</div>
                      <div><strong>Population Exposed:</strong> {rz.population_exposed?.toLocaleString()}</div>
                      <div><strong>Habitations:</strong> {rz.habitation_count}</div>
                      <div><strong>Priority:</strong> {rz.relocation_priority}</div>
                    </div>
                  </div>
                </Popup>
              </Polygon>
              {/* Center label */}
              <Marker position={center} icon={getRedZoneLabelIcon(rz.id)}>
                <Popup>
                  <strong>{rz.name}</strong><br />
                  Risk: {rz.risk_score}
                </Popup>
              </Marker>
            </div>
          );
        })}

        {/* Habitation markers — size-encoded, relocated shown differently */}
        {showHabs && filteredHabs.map(h => {
          const isRelocated = relocatedIds.has(h.id);
          const color = isRelocated ? '#10b981' : getRiskHexColor(h.risk_class);
          return (
            <Marker
              key={h.id}
              position={[h.latitude, h.longitude]}
              icon={getHabitationIcon(color, h.population, isRelocated)}
            >
              <Popup>
                <div className="min-w-[210px]">
                  <h3 className="font-bold text-lg">{h.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{h.district}, {h.state}</p>
                  {isRelocated && (
                    <div className="mb-2 text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-1 rounded flex items-center gap-1">
                      ✓ RELOCATED → {relocationPlans[h.id]?.safeZoneName}
                    </div>
                  )}
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <RiskBadge riskClass={h.risk_class} />
                    <PriorityBadge priority={h.relocation_priority} />
                  </div>
                  <div className="text-sm space-y-1 mb-3">
                    <div><strong>Pop:</strong> {h.population?.toLocaleString()}</div>
                    <div><strong>Hazard:</strong> <span className="capitalize">{h.hazard_type}</span></div>
                    <div><strong>Risk Score:</strong> {h.risk_score}/100</div>
                    <div><strong>Capacity:</strong> {h.capacity_utilization}%</div>
                  </div>
                  <Link to={`/habitation/${h.id}`} className="text-blue-600 hover:underline text-sm font-medium">View Details →</Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Safe Zones */}
        {showSafeZones && seedSafeZones.map(sz => (
          <Marker key={sz.id} position={[sz.latitude, sz.longitude]} icon={getSafeZoneIcon()}>
            <Popup>
              <div>
                <h3 className="font-bold text-emerald-800">{sz.name}</h3>
                <p className="text-sm">Capacity: {sz.available_capacity?.toLocaleString()}</p>
                <p className="text-sm">Safety: {sz.safety_score}%</p>
                <p className="text-xs text-slate-500">{sz.district}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}