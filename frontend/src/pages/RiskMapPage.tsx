import { useState } from 'react';
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
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const getDiamondIcon = () => L.divIcon({
  html: `<div style="background-color: #10b981; width: 16px; height: 16px; transform: rotate(45deg); border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
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
                <Link to={`/habitation/${h.id}`} className="text-blue-600 hover:underline text-sm font-medium">View Details →</Link>
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
}