import { useState, useMemo } from 'react';
import { PageHeader, RiskBadge, PriorityBadge, Disclaimer } from '../components/ui';
import { Printer } from 'lucide-react';
import { useHabitations } from '../hooks/useHabitations';
import { useStore } from '../store/useStore';
import { seedSafeZones } from '../data/seedData';

function dist(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const now = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });

export default function ReportsPage() {
  const { allHabitations, relocatedIds, relocationPlans } = useHabitations();
  const weightConfig = useStore(s => s.weightConfig);

  const [type, setType] = useState<'habitation' | 'regional' | 'relocation'>('habitation');
  const [selId, setSelId] = useState('');

  const sortedHabs = useMemo(
    () => [...allHabitations].sort((a, b) => b.risk_score - a.risk_score),
    [allHabitations]
  );

  // Determine selected habitation — default to highest risk
  const effectiveId = selId || (sortedHabs[0]?.id ?? '');
  const h = allHabitations.find(x => x.id === effectiveId) || sortedHabs[0];

  const nearestZones = h ? [...seedSafeZones]
    .map(sz => ({ ...sz, distance_km: dist(h.latitude, h.longitude, sz.latitude, sz.longitude) }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 3) : [];

  const vuln = h ? (h.children_count || 0) + (h.elderly_count || 0) + (h.disabled_count || 0) + (h.pregnant_women_count || 0) : 0;
  const critHabs = allHabitations.filter(x => x.risk_class === 'CRITICAL');
  const highHabs = allHabitations.filter(x => x.risk_class === 'HIGH');
  const totalPop = allHabitations.reduce((s, x) => s + (x.population || 0), 0);
  const relocatedList = allHabitations.filter(h => relocatedIds.has(h.id));

  const isRelocated = h ? relocatedIds.has(h.id) : false;
  const reloPlan = h ? relocationPlans[h.id] : undefined;

  const weightLabels: Record<string, string> = {
    haz: 'Hazard Severity',
    pop: 'Population Exposure',
    vul: 'Vulnerable Population',
    inf: 'Infrastructure',
    hist: 'Historical Frequency',
    emerg: 'Emergency Access',
    env: 'Environmental',
  };

  if (allHabitations.length === 0) {
    return <div className="p-6"><PageHeader title="Reports" subtitle="Loading…" /></div>;
  }

  return (
    <div className="p-6">
      <PageHeader title="Reports" subtitle="Generate and print situation reports for any habitation or region." />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Options panel */}
        <div className="lg:col-span-1 space-y-4 no-print">
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <h3 className="font-bold text-sm mb-3">Report Type</h3>
            <div className="space-y-2 text-sm">
              {[
                { val: 'habitation', label: 'Habitation Report' },
                { val: 'regional', label: 'Regional Summary' },
                { val: 'relocation', label: 'Relocation Status Report' },
              ].map(opt => (
                <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" checked={type === opt.val as any}
                    onChange={() => setType(opt.val as any)} className="accent-blue-600" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {type === 'habitation' && (
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h3 className="font-bold text-sm mb-3">Select Habitation</h3>
              <select value={effectiveId} onChange={e => setSelId(e.target.value)}
                className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {sortedHabs.map(hab => (
                  <option key={hab.id} value={hab.id}>
                    {hab.name} ({hab.risk_class}) {relocatedIds.has(hab.id) ? '✓' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-2">
                ✓ = Relocated habitation · Sorted by risk score
              </p>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>

          {/* Dataset info */}
          <div className="bg-slate-50 border rounded-lg p-3 text-xs text-slate-500">
            <div className="font-semibold text-slate-700 mb-1">Active Dataset</div>
            <div>{allHabitations.length} habitations loaded</div>
            <div>{critHabs.length} critical · {highHabs.length} high</div>
            <div>{relocatedIds.size} relocated</div>
          </div>
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
                    {type === 'habitation' ? 'Habitation Risk Assessment Report'
                      : type === 'regional' ? 'Regional Risk Summary Report'
                      : 'Relocation Status Report'}
                  </h1>
                  <div className="text-slate-500 mt-1">
                    {type === 'habitation' && h ? `${h.name}, ${h.district}, ${h.state}`
                      : type === 'regional' ? 'All Regions — National Overview'
                      : `${relocatedList.length} Habitation${relocatedList.length !== 1 ? 's' : ''} Relocated`}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div className="font-semibold text-slate-700">Purva Drishti Platform v1.0</div>
                  <div className="mt-1">{now}</div>
                  <div className="mt-1 bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">DEMONSTRATION ONLY</div>
                </div>
              </div>
            </div>

            {/* ===== HABITATION REPORT ===== */}
            {type === 'habitation' && h && (
              <div className="space-y-6">
                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">1. Executive Summary</h2>
                  {isRelocated && (
                    <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-800 font-medium">
                      ✓ This habitation has been relocated to <strong>{reloPlan?.safeZoneName}</strong> on {reloPlan?.timestamp}.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-slate-500">Habitation ID:</span> <span className="font-medium">{h.id}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Location:</span> <span className="font-medium">{h.district}, {h.state}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Coordinates:</span> <span className="font-medium">{(h.latitude || 0).toFixed(3)}°N, {(h.longitude || 0).toFixed(3)}°E</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Total Population:</span> <span className="font-medium">{(h.population || 0).toLocaleString()}</span></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-slate-500">Risk Score:</span> <span className="font-bold text-lg">{h.risk_score}/100</span></div>
                      <div className="flex justify-between items-center"><span className="text-slate-500">Risk Class:</span> <RiskBadge riskClass={h.risk_class} /></div>
                      <div className="flex justify-between items-center"><span className="text-slate-500">Priority:</span> <PriorityBadge priority={h.relocation_priority} /></div>
                      <div className="flex justify-between"><span className="text-slate-500">Capacity Utilization:</span> <span className="font-medium">{h.capacity_utilization || 0}%</span></div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">2. Hazard Profile</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500">Primary Hazard:</span> <span className="capitalize font-medium">{h.hazard_type}</span></div>
                    <div><span className="text-slate-500">Hazard Severity:</span> <span className="font-medium">{((h.hazard_severity || 0) * 100).toFixed(0)}%</span></div>
                    <div><span className="text-slate-500">Distance to Hazard:</span> <span className="font-medium">{h.distance_from_hazard_km || 'N/A'} km</span></div>
                    <div><span className="text-slate-500">Historical Events:</span> <span className="font-medium">{h.historical_event_count || 0}</span></div>
                    <div><span className="text-slate-500">Annual Rainfall:</span> <span className="font-medium">{h.rainfall_annual_mm || 'N/A'} mm</span></div>
                    <div><span className="text-slate-500">Elevation:</span> <span className="font-medium">{h.elevation || 'N/A'} m</span></div>
                    <div><span className="text-slate-500">Slope:</span> <span className="font-medium">{h.slope_degrees || 0}°</span></div>
                    <div><span className="text-slate-500">Soil Type:</span> <span className="font-medium">{h.soil_type || 'N/A'}</span></div>
                  </div>
                </section>

                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">3. Vulnerable Population</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500">Children (&lt;18):</span> <span className="font-medium">{(h.children_count || 0).toLocaleString()} ({h.population ? ((h.children_count || 0) / h.population * 100).toFixed(1) : 0}%)</span></div>
                    <div><span className="text-slate-500">Elderly (&gt;60):</span> <span className="font-medium">{(h.elderly_count || 0).toLocaleString()} ({h.population ? ((h.elderly_count || 0) / h.population * 100).toFixed(1) : 0}%)</span></div>
                    <div><span className="text-slate-500">Disabled:</span> <span className="font-medium">{(h.disabled_count || 0).toLocaleString()}</span></div>
                    <div><span className="text-slate-500">Pregnant Women:</span> <span className="font-medium">{(h.pregnant_women_count || 0).toLocaleString()}</span></div>
                    <div><span className="text-slate-500">Below Poverty Line:</span> <span className="font-medium">{(h.below_poverty_count || 0).toLocaleString()}</span></div>
                    <div><span className="text-slate-500">Total Vulnerable:</span> <span className="font-bold">{vuln.toLocaleString()} ({h.population ? (vuln / h.population * 100).toFixed(1) : 0}%)</span></div>
                  </div>
                </section>

                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">4. Carrying Capacity Assessment</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-slate-500">Water:</span> <span className="font-medium">{(h.water_capacity_liters_per_day || 0).toLocaleString()} L/day</span></div>
                    <div><span className="text-slate-500">Shelter Capacity:</span> <span className="font-medium">{h.shelter_capacity_persons || 0} persons</span></div>
                    <div><span className="text-slate-500">Healthcare Beds:</span> <span className="font-medium">{h.healthcare_beds || 0}</span></div>
                    <div><span className="text-slate-500">Food Stock:</span> <span className="font-medium">{h.food_stock_days || 0} days</span></div>
                    <div><span className="text-slate-500">Sanitation Coverage:</span> <span className="font-medium">{h.sanitation_coverage_pct || 0}%</span></div>
                    <div><span className="text-slate-500">Overall Utilization:</span> <span className="font-bold">{h.capacity_utilization || 0}% ({h.capacity_status || 'N/A'})</span></div>
                  </div>
                </section>

                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">5. Relocation Assessment</h2>
                  {isRelocated ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded mb-3 text-sm">
                      <strong>Status:</strong> RELOCATED to {reloPlan?.safeZoneName} on {reloPlan?.timestamp}
                    </div>
                  ) : (
                    <div className="mb-3"><span className="text-slate-500">Relocation Priority:</span> <PriorityBadge priority={h.relocation_priority} /></div>
                  )}
                  <div className="space-y-2">
                    {nearestZones.map((sz, i) => (
                      <div key={sz.id} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-xs">
                        <span className="font-medium">#{i + 1} {sz.name}</span>
                        <span>{sz.distance_km.toFixed(1)} km away</span>
                        <span>Capacity: {(sz.available_capacity || 0).toLocaleString()}</span>
                        <span>Safety: {sz.safety_score}/100</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">6. Risk Model (Active Weights)</h2>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {Object.entries(weightConfig).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{weightLabels[k] || k}:</span>
                        <span className="font-mono font-bold">{v}%</span>
                      </div>
                    ))}
                  </div>
                </section>

                {h.recommended_actions && h.recommended_actions.length > 0 && (
                  <section>
                    <h2 className="font-bold text-base border-b pb-1 mb-3">7. Recommended Actions</h2>
                    <ol className="list-decimal list-inside space-y-1 text-slate-700">
                      {h.recommended_actions.map((a: string, i: number) => <li key={i}>{a}</li>)}
                    </ol>
                  </section>
                )}
              </div>
            )}

            {/* ===== REGIONAL REPORT ===== */}
            {type === 'regional' && (
              <div className="space-y-6">
                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">1. Regional Overview</h2>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div className="bg-red-50 rounded p-3">
                      <div className="text-2xl font-bold text-red-700">{critHabs.length}</div>
                      <div className="text-sm text-slate-600">CRITICAL Habitations</div>
                    </div>
                    <div className="bg-orange-50 rounded p-3">
                      <div className="text-2xl font-bold text-orange-700">{highHabs.length}</div>
                      <div className="text-sm text-slate-600">HIGH Risk</div>
                    </div>
                    <div className="bg-blue-50 rounded p-3">
                      <div className="text-2xl font-bold text-blue-700">{totalPop.toLocaleString()}</div>
                      <div className="text-sm text-slate-600">Total Population</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-emerald-50 rounded p-3">
                      <div className="text-2xl font-bold text-emerald-700">{relocatedIds.size}</div>
                      <div className="text-sm text-slate-600">Relocated</div>
                    </div>
                    <div className="bg-purple-50 rounded p-3">
                      <div className="text-2xl font-bold text-purple-700">{allHabitations.filter(x => (x.capacity_utilization || 0) > 100).length}</div>
                      <div className="text-sm text-slate-600">Capacity Exceeded</div>
                    </div>
                    <div className="bg-slate-50 rounded p-3">
                      <div className="text-2xl font-bold text-slate-700">{allHabitations.length}</div>
                      <div className="text-sm text-slate-600">Total Habitations</div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">2. Top Priority Habitations</h2>
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">District, State</th>
                        <th className="text-left p-2">Hazard</th>
                        <th className="text-left p-2">Risk Score</th>
                        <th className="text-left p-2">Risk Class</th>
                        <th className="text-left p-2">Priority</th>
                        <th className="text-right p-2">Population</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedHabs.slice(0, 20).map(hab => (
                        <tr key={hab.id} className={`border-t ${relocatedIds.has(hab.id) ? 'bg-emerald-50' : ''}`}>
                          <td className="p-2 font-medium">{hab.name}</td>
                          <td className="p-2 text-slate-500">{hab.district}, {(hab.state || '').split(' ').slice(-1)[0]}</td>
                          <td className="p-2 capitalize">{hab.hazard_type}</td>
                          <td className="p-2">{hab.risk_score}</td>
                          <td className="p-2"><RiskBadge riskClass={hab.risk_class} /></td>
                          <td className="p-2"><PriorityBadge priority={hab.relocation_priority} /></td>
                          <td className="p-2 text-right">{(hab.population || 0).toLocaleString()}</td>
                          <td className="p-2 text-xs">{relocatedIds.has(hab.id) ? <span className="text-emerald-700 font-semibold">✓ Relocated</span> : <span className="text-slate-400">Active</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">3. Active Risk Model Weights</h2>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {Object.entries(weightConfig).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{weightLabels[k] || k}:</span>
                        <span className="font-mono font-bold">{v}%</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">4. Methodology</h2>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Risk scores are computed using a weighted multi-dimensional model across 7 factors: Hazard Severity,
                    Population Exposure, Vulnerable Population, Infrastructure Vulnerability, Historical Frequency,
                    Emergency Accessibility, and Environmental Sensitivity. Weights are configurable via Platform Settings
                    and reflected in all calculations. Data includes both baseline and uploaded habitation datasets.
                    All data shown is synthetic demonstration data and must not be used for operational decisions.
                  </p>
                </section>
              </div>
            )}

            {/* ===== RELOCATION REPORT ===== */}
            {type === 'relocation' && (
              <div className="space-y-6">
                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">1. Relocation Summary</h2>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div className="bg-emerald-50 rounded p-3">
                      <div className="text-2xl font-bold text-emerald-700">{relocatedList.length}</div>
                      <div className="text-sm text-slate-600">Habitations Relocated</div>
                    </div>
                    <div className="bg-blue-50 rounded p-3">
                      <div className="text-2xl font-bold text-blue-700">{relocatedList.reduce((s, h) => s + (h.population || 0), 0).toLocaleString()}</div>
                      <div className="text-sm text-slate-600">People Displaced</div>
                    </div>
                    <div className="bg-slate-50 rounded p-3">
                      <div className="text-2xl font-bold text-slate-700">{allHabitations.filter(h => !relocatedIds.has(h.id) && (h.risk_class === 'CRITICAL' || h.relocation_priority === 'P1-IMMEDIATE')).length}</div>
                      <div className="text-sm text-slate-600">Still Critical</div>
                    </div>
                  </div>
                </section>

                {relocatedList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    No relocations have been assigned yet. Use the Relocation page to assign safe zones.
                  </div>
                ) : (
                  <section>
                    <h2 className="font-bold text-base border-b pb-1 mb-3">2. Relocation Plans</h2>
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2">Habitation</th>
                          <th className="text-left p-2">District, State</th>
                          <th className="text-left p-2">Risk Class</th>
                          <th className="text-right p-2">Population</th>
                          <th className="text-left p-2">Destination Safe Zone</th>
                          <th className="text-left p-2">Assigned At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relocatedList.map(hab => {
                          const plan = relocationPlans[hab.id];
                          return (
                            <tr key={hab.id} className="border-t bg-emerald-50">
                              <td className="p-2 font-medium">{hab.name}</td>
                              <td className="p-2 text-slate-500">{hab.district}, {(hab.state || '').split(' ').slice(-1)[0]}</td>
                              <td className="p-2"><RiskBadge riskClass={hab.risk_class} /></td>
                              <td className="p-2 text-right">{(hab.population || 0).toLocaleString()}</td>
                              <td className="p-2 font-medium text-emerald-800">✓ {plan?.safeZoneName}</td>
                              <td className="p-2 text-slate-500">{plan?.timestamp}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </section>
                )}

                <section>
                  <h2 className="font-bold text-base border-b pb-1 mb-3">3. Remaining Critical Habitations (Not Relocated)</h2>
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">District</th>
                        <th className="text-left p-2">Risk</th>
                        <th className="text-left p-2">Priority</th>
                        <th className="text-right p-2">Population</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allHabitations
                        .filter(x => !relocatedIds.has(x.id) && (x.risk_class === 'CRITICAL' || x.risk_class === 'HIGH'))
                        .slice(0, 15)
                        .map(hab => (
                          <tr key={hab.id} className="border-t">
                            <td className="p-2 font-medium">{hab.name}</td>
                            <td className="p-2 text-slate-500">{hab.district}</td>
                            <td className="p-2"><RiskBadge riskClass={hab.risk_class} /></td>
                            <td className="p-2"><PriorityBadge priority={hab.relocation_priority} /></td>
                            <td className="p-2 text-right">{(hab.population || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </section>
              </div>
            )}

            {/* Footer */}
            <div className="border-t mt-8 pt-4 text-xs text-slate-400 flex justify-between">
              <span>Purva Drishti — Disaster Risk Intelligence Platform (Prototype) | SIH26191</span>
              <span>Generated: {now}</span>
            </div>
            <Disclaimer />
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          aside, header, .no-print, nav, button { display: none !important; }
          body, main, #root { background: white !important; padding: 0 !important; margin: 0 !important; }
          .grid { display: block !important; }
          .lg\\:col-span-1 { display: none !important; }
          .lg\\:col-span-3 { width: 100% !important; max-width: 100% !important; }
          #print-report { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; }
        }
      `}</style>
    </div>
  );
}