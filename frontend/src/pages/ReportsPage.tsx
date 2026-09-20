import { useState } from 'react';
import { PageHeader, RiskBadge, PriorityBadge, Disclaimer } from '../components/ui';
import { seedHabitations, seedSafeZones } from '../data/seedData';
import { Printer } from 'lucide-react';


function dist(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const now = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });

export default function ReportsPage() {
  const [type, setType] = useState<'habitation' | 'regional'>('habitation');
  const [selId, setSelId] = useState(seedHabitations[0].id);

  const h = seedHabitations.find(x => x.id === selId) || seedHabitations[0];
  const nearestZones = [...seedSafeZones]
    .map(sz => ({ ...sz, distance_km: dist(h.latitude, h.longitude, sz.latitude, sz.longitude) }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 3);

  const vuln = h.children_count + h.elderly_count + h.disabled_count + h.pregnant_women_count;
  const critHabs = seedHabitations.filter(x => x.risk_class === 'CRITICAL');
  const highHabs = seedHabitations.filter(x => x.risk_class === 'HIGH');

  return (
    <div className="p-6">
      <PageHeader title="Reports" subtitle="Generate and print situation reports." />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Options panel */}
        <div className="lg:col-span-1 space-y-4 no-print">
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="font-bold text-sm mb-3">Report Options</h3>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" checked={type === 'habitation'} onChange={() => setType('habitation')} />
                Habitation Report
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" checked={type === 'regional'} onChange={() => setType('regional')} />
                Regional Summary
              </label>
            </div>
          </div>

          {type === 'habitation' && (
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h3 className="font-bold text-sm mb-3">Select Habitation</h3>
              <select
                value={selId}
                onChange={e => setSelId(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                {[...seedHabitations].sort((a, b) => b.risk_score - a.risk_score).map(hab => (
                  <option key={hab.id} value={hab.id}>{hab.name} ({hab.risk_class})</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded font-medium text-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>

        {/* Report preview */}
        <div className="lg:col-span-3">
          <div id="print-report" className="bg-white rounded-lg border shadow-sm p-8 text-sm">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Government of India — NDMA</div>
                  <h1 className="text-xl font-bold text-slate-900">
                    {type === 'habitation' ? 'Habitation Risk Assessment Report' : 'Regional Risk Summary Report'}
                  </h1>
                  <div className="text-slate-500 mt-1">
                    {type === 'habitation' ? `${h.name}, ${h.district}, ${h.state}` : 'All Regions — National Overview'}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div className="font-semibold text-slate-700">Purva Drishti Platform v1.0</div>
                  <div className="mt-1">{now}</div>
                  <div className="mt-1 bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">DEMONSTRATION ONLY</div>
                </div>
              </div>
            </div>

            {type === 'habitation' ? (
              <div className="space-y-6">
                {/* Executive Summary */}
                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">1. Executive Summary</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-slate-500">Habitation ID:</span> <span className="font-medium">{h.id}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Location:</span> <span className="font-medium">{h.district}, {h.state}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Coordinates:</span> <span className="font-medium">{h.latitude.toFixed(3)}°N, {h.longitude.toFixed(3)}°E</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Total Population:</span> <span className="font-medium">{h.population.toLocaleString()}</span></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-slate-500">Risk Score:</span> <span className="font-bold text-lg">{h.risk_score}/100</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-500">Risk Class:</span> <RiskBadge riskClass={h.risk_class} /></div>
                      <div className="flex justify-between items-center"><span className="text-slate-500">Priority:</span> <PriorityBadge priority={h.relocation_priority} /></div>
                      <div className="flex justify-between"><span className="text-slate-500">Capacity Utilization:</span> <span className="font-medium">{h.capacity_utilization}%</span></div>
                    </div>
                  </div>
                </section>

                {/* Hazard */}
                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">2. Hazard Profile</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500">Primary Hazard:</span> <span className="capitalize font-medium">{h.hazard_type}</span></div>
                    <div><span className="text-slate-500">Hazard Severity:</span> <span className="font-medium">{(h.hazard_severity * 100).toFixed(0)}%</span></div>
                    <div><span className="text-slate-500">Distance to Hazard:</span> <span className="font-medium">{h.distance_from_hazard_km} km</span></div>
                    <div><span className="text-slate-500">Historical Events:</span> <span className="font-medium">{h.historical_event_count} (since 2010)</span></div>
                    <div><span className="text-slate-500">Annual Rainfall:</span> <span className="font-medium">{h.rainfall_annual_mm} mm</span></div>
                    <div><span className="text-slate-500">Elevation:</span> <span className="font-medium">{h.elevation} m</span></div>
                  </div>
                </section>

                {/* Vulnerable Population */}
                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">3. Vulnerable Population</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500">Children (&lt;18):</span> <span className="font-medium">{h.children_count.toLocaleString()} ({(h.children_count/h.population*100).toFixed(1)}%)</span></div>
                    <div><span className="text-slate-500">Elderly (&gt;60):</span> <span className="font-medium">{h.elderly_count.toLocaleString()} ({(h.elderly_count/h.population*100).toFixed(1)}%)</span></div>
                    <div><span className="text-slate-500">Disabled:</span> <span className="font-medium">{h.disabled_count.toLocaleString()}</span></div>
                    <div><span className="text-slate-500">Pregnant Women:</span> <span className="font-medium">{h.pregnant_women_count.toLocaleString()}</span></div>
                    <div><span className="text-slate-500">Below Poverty Line:</span> <span className="font-medium">{h.below_poverty_count.toLocaleString()} ({(h.below_poverty_count/h.population*100).toFixed(1)}%)</span></div>
                    <div><span className="text-slate-500">Total Vulnerable:</span> <span className="font-bold">{vuln.toLocaleString()} ({(vuln/h.population*100).toFixed(1)}%)</span></div>
                  </div>
                </section>

                {/* Carrying Capacity */}
                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">4. Carrying Capacity Assessment</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500">Water:</span> <span className="font-medium">{h.water_capacity_liters_per_day.toLocaleString()} L/day</span></div>
                    <div><span className="text-slate-500">Shelter Capacity:</span> <span className="font-medium">{h.shelter_capacity_persons} persons</span></div>
                    <div><span className="text-slate-500">Healthcare Beds:</span> <span className="font-medium">{h.healthcare_beds}</span></div>
                    <div><span className="text-slate-500">Food Stock:</span> <span className="font-medium">{h.food_stock_days} days</span></div>
                    <div><span className="text-slate-500">Sanitation Coverage:</span> <span className="font-medium">{h.sanitation_coverage_pct}%</span></div>
                    <div><span className="text-slate-500">Overall Utilization:</span> <span className="font-bold">{h.capacity_utilization}% ({h.capacity_status})</span></div>
                  </div>
                </section>

                {/* Relocation */}
                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">5. Relocation Assessment</h2>
                  <div className="mb-3"><span className="text-slate-500">Relocation Priority:</span> <PriorityBadge priority={h.relocation_priority} /></div>
                  <div className="space-y-2">
                    {nearestZones.map((sz, i) => (
                      <div key={sz.id} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-xs">
                        <span className="font-medium">#{i + 1} {sz.name}</span>
                        <span>{sz.distance_km.toFixed(1)} km away</span>
                        <span>Capacity: {sz.available_capacity.toLocaleString()}</span>
                        <span>Safety: {sz.safety_score}/100</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Actions */}
                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">6. Recommended Actions</h2>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    {h.recommended_actions.map((a, i) => <li key={i}>{a}</li>)}
                  </ol>
                </section>
              </div>
            ) : (
              /* Regional Report */
              <div className="space-y-6">
                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">1. Regional Overview</h2>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-red-50 rounded p-3">
                      <div className="text-2xl font-bold text-red-700">{critHabs.length}</div>
                      <div className="text-sm text-slate-600">CRITICAL Habitations</div>
                    </div>
                    <div className="bg-orange-50 rounded p-3">
                      <div className="text-2xl font-bold text-orange-700">{highHabs.length}</div>
                      <div className="text-sm text-slate-600">HIGH Risk Habitations</div>
                    </div>
                    <div className="bg-blue-50 rounded p-3">
                      <div className="text-2xl font-bold text-blue-700">{seedHabitations.reduce((s, h) => s + h.population, 0).toLocaleString()}</div>
                      <div className="text-sm text-slate-600">Total Population</div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">2. Critical Habitations Requiring Immediate Action</h2>
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">District, State</th>
                        <th className="text-left p-2">Risk Score</th>
                        <th className="text-left p-2">Risk Class</th>
                        <th className="text-left p-2">Priority</th>
                        <th className="text-right p-2">Population</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...seedHabitations].sort((a, b) => b.risk_score - a.risk_score).slice(0, 15).map(hab => (
                        <tr key={hab.id} className="border-t">
                          <td className="p-2 font-medium">{hab.name}</td>
                          <td className="p-2 text-slate-500">{hab.district}, {hab.state}</td>
                          <td className="p-2">{hab.risk_score}</td>
                          <td className="p-2"><RiskBadge riskClass={hab.risk_class} /></td>
                          <td className="p-2"><PriorityBadge priority={hab.relocation_priority} /></td>
                          <td className="p-2 text-right">{hab.population.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">3. Methodology</h2>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Risk scores are computed using a weighted rule-based model across 7 dimensions: Hazard Severity (25%),
                    Population Exposure (20%), Vulnerable Population (15%), Infrastructure Vulnerability (15%),
                    Historical Frequency (10%), Emergency Accessibility (10%), and Environmental Sensitivity (5%).
                    All data shown is synthetic demonstration data and must not be used for operational decisions.
                  </p>
                </section>
              </div>
            )}

            {/* Footer */}
            <div className="border-t mt-8 pt-4 text-xs text-slate-400 flex justify-between">
              <span>Purva Drishti — Disaster Risk Intelligence Platform (Prototype)</span>
              <span>Generated: {now}</span>
            </div>
            <Disclaimer />
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          aside, header, .no-print, nav, button {
            display: none !important;
          }
          body, main, #root {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .grid {
            display: block !important;
          }
          .lg\\:col-span-1 {
            display: none !important;
          }
          .lg\\:col-span-3 {
            width: 100% !important;
            max-width: 100% !important;
          }
          #print-report {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}