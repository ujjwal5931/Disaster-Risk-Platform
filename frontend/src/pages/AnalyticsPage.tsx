import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { useHabitations } from '../hooks/useHabitations';
import { seedSafeZones } from '../data/seedData';
import { PageHeader, RiskBadge, PriorityBadge, KPICard, Disclaimer } from '../components/ui';
import { CheckCircle, Search } from 'lucide-react';

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MODERATE: '#ca8a04',
  LOW: '#16a34a',
};

const HAZARD_COLORS = ['#3b82f6', '#ea580c', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

/** Miniature population-proportional treemap rendered as a pure SVG grid */
function RiskTreemap({ data }: { data: { name: string; population: number; risk_class: string }[] }) {
  const total = data.reduce((s, d) => s + d.population, 0) || 1;
  const W = 720;
  const H = 320;

  // Simple row-based layout: sort by population desc, slice by row
  const sorted = [...data].sort((a, b) => b.population - a.population);
  const rows: typeof data[] = [];
  let row: typeof data = [];
  let rowPop = 0;
  const rowTarget = total / 4; // aim for 4 rows

  for (const item of sorted) {
    row.push(item);
    rowPop += item.population;
    if (rowPop >= rowTarget && rows.length < 3) {
      rows.push(row);
      row = [];
      rowPop = 0;
    }
  }
  if (row.length > 0) rows.push(row);

  const rowH = H / rows.length;
  const rects: { x: number; y: number; w: number; h: number; name: string; risk_class: string; population: number }[] = [];

  rows.forEach((rowItems, ri) => {
    const rowTotal = rowItems.reduce((s, d) => s + d.population, 0) || 1;
    let xOff = 0;
    rowItems.forEach((item) => {
      const w = (item.population / rowTotal) * W;
      rects.push({ x: xOff, y: ri * rowH, w, h: rowH, name: item.name, risk_class: item.risk_class, population: item.population });
      xOff += w;
    });
  });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {rects.map((r, i) => {
        const fill = RISK_COLORS[r.risk_class] || '#94a3b8';
        const showLabel = r.w > 50 && r.h > 24;
        return (
          <g key={i}>
            <rect x={r.x + 1} y={r.y + 1} width={Math.max(0, r.w - 2)} height={Math.max(0, r.h - 2)}
              fill={fill} fillOpacity={0.85} rx={3} />
            {showLabel && (
              <>
                <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 4}
                  textAnchor="middle" fill="white" fontSize={Math.min(11, r.w / 8)}
                  fontWeight="700" dominantBaseline="middle">
                  {r.name.length > 12 ? r.name.slice(0, 11) + '…' : r.name}
                </text>
                <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 10}
                  textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={9}>
                  {r.population.toLocaleString()}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function AnalyticsPage() {
  const { allHabitations, relocatedIds, relocationPlans, relocatedHabitations } = useHabitations();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('risk_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // === KPI Calculations ===
  const totalHabs = allHabitations.length;
  const criticalCount = allHabitations.filter(h => h.risk_class === 'CRITICAL').length;
  const highCount = allHabitations.filter(h => h.risk_class === 'HIGH').length;
  const capExceeded = allHabitations.filter(h => (h.capacity_utilization || 0) > 100).length;
  const relocatedCount = relocatedIds.size;
  const popAtRisk = allHabitations
    .filter(h => h.risk_class === 'HIGH' || h.risk_class === 'CRITICAL')
    .reduce((acc, h) => acc + (h.population || 0), 0);

  // === Safe Zone Capacity ===
  const safeZoneCapacityUsed = useMemo(() => {
    const usage: Record<string, number> = {};
    Object.values(relocationPlans).forEach((plan: any) => {
      usage[plan.safeZoneName] = (usage[plan.safeZoneName] || 0) + 1;
    });
    return usage;
  }, [relocationPlans]);

  // === Risk Distribution Pie ===
  const riskPie = [
    { name: 'CRITICAL', value: criticalCount },
    { name: 'HIGH', value: highCount },
    { name: 'MODERATE', value: allHabitations.filter(h => h.risk_class === 'MODERATE').length },
    { name: 'LOW', value: allHabitations.filter(h => h.risk_class === 'LOW').length },
  ].filter(d => d.value > 0);

  // === Hazard Distribution Pie ===
  const hazardPie = useMemo(() => {
    const counts: Record<string, number> = {};
    allHabitations.forEach(h => {
      const t = (h.hazard_type || 'unknown').toLowerCase();
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k.toUpperCase(), value: counts[k] }));
  }, [allHabitations]);

  // === State-wise Risk Bar ===
  const stateData = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    allHabitations.forEach(h => {
      const st = (h.state || 'Unknown').split(' ').slice(-1)[0];
      if (!grouped[st]) grouped[st] = { total: 0, count: 0 };
      grouped[st].total += h.risk_score || 0;
      grouped[st].count += 1;
    });
    return Object.keys(grouped)
      .map(s => ({ state: s, avgRisk: Math.round(grouped[s].total / grouped[s].count) }))
      .sort((a, b) => b.avgRisk - a.avgRisk);
  }, [allHabitations]);

  // === Capacity Stress Top 10 ===
  const capacityTop10 = useMemo(() =>
    [...allHabitations]
      .sort((a, b) => (b.capacity_utilization || 0) - (a.capacity_utilization || 0))
      .slice(0, 10)
      .map(h => ({ name: h.name.slice(0, 14), util: h.capacity_utilization || 0 })),
    [allHabitations]
  );

  // === Population Breakdown Top 12 ===
  const popBreakdownData = useMemo(() =>
    [...allHabitations]
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, 12)
      .map(h => ({
        name: h.name.slice(0, 9),
        Children: h.children_count || 0,
        Elderly: h.elderly_count || 0,
        Disabled: h.disabled_count || 0,
        Pregnant: h.pregnant_women_count || 0,
      })),
    [allHabitations]
  );

  // === Full Data Table ===
  const tableData = useMemo(() => {
    let data = [...allHabitations];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(h =>
        (h.name || '').toLowerCase().includes(q) ||
        (h.district || '').toLowerCase().includes(q) ||
        (h.state || '').toLowerCase().includes(q) ||
        (h.hazard_type || '').toLowerCase().includes(q)
      );
    }
    if (riskFilter !== 'ALL') data = data.filter(h => h.risk_class === riskFilter);
    data.sort((a, b) => {
      const va = (a as any)[sortField] ?? 0;
      const vb = (b as any)[sortField] ?? 0;
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return data;
  }, [allHabitations, searchQuery, riskFilter, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortTh = ({ field, label }: { field: string; label: string }) => (
    <th className="px-3 py-2 text-left font-semibold cursor-pointer hover:text-blue-600 select-none whitespace-nowrap"
      onClick={() => handleSort(field)}>
      {label} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  if (allHabitations.length === 0) {
    return (
      <div className="p-6">
        <PageHeader title="Analytics Overview" subtitle="Loading data..." />
        <div className="text-slate-400 text-center py-20">Loading habitation data…</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Analytics Overview"
        subtitle="Comprehensive data intelligence — risk distribution, population exposure, capacity stress, and relocation status."
      />

      {/* === KPI Row === */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Total Habitations" value={totalHabs} color="blue" />
        <KPICard label="Pop at Risk" value={popAtRisk.toLocaleString()} color="red" sub="HIGH + CRITICAL" />
        <KPICard label="Critical Zones" value={criticalCount} color="red" />
        <KPICard label="High Risk" value={highCount} color="orange" />
        <KPICard label="Cap Exceeded" value={capExceeded} color="purple" sub=">100% utilization" />
        <KPICard label="Relocated" value={relocatedCount} color="green" sub="habitations" />
      </div>

      {/* === Treemap + Risk Pie === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-1">Habitation Risk Treemap</h3>
          <p className="text-xs text-slate-500 mb-3">Box size = population · Color = risk class</p>
          <RiskTreemap data={allHabitations.map(h => ({ name: h.name, population: h.population || 100, risk_class: h.risk_class }))} />
          <div className="flex gap-4 mt-3 text-xs flex-wrap">
            {Object.entries(RISK_COLORS).map(([cls, color]) => (
              <div key={cls} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
                <span>{cls}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-1">Risk Distribution</h3>
          <p className="text-xs text-slate-500 mb-2">By risk class count</p>
          <PieChart width={220} height={220}>
            <Pie data={riskPie} cx={110} cy={100} outerRadius={85} dataKey="value"
              label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
              {riskPie.map((entry, i) => (
                <Cell key={i} fill={RISK_COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/* === State-wise Risk + Hazard Pie === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4">State-wise Average Risk Score</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stateData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <XAxis type="number" domain={[0, 100]} fontSize={11} />
              <YAxis type="category" dataKey="state" fontSize={11} width={80} />
              <Tooltip formatter={(v: any) => [`${v}`, 'Avg Risk Score']} />
              <Bar dataKey="avgRisk" radius={[0, 4, 4, 0]}>
                {stateData.map((entry, i) => (
                  <Cell key={i} fill={entry.avgRisk >= 75 ? '#dc2626' : entry.avgRisk >= 50 ? '#ea580c' : entry.avgRisk >= 25 ? '#ca8a04' : '#16a34a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4">Hazard Type Distribution</h3>
          <PieChart width={280} height={260}>
            <Pie data={hazardPie} cx={140} cy={120} outerRadius={100} dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={10}>
              {hazardPie.map((_, i) => (
                <Cell key={i} fill={HAZARD_COLORS[i % HAZARD_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/* === Population Breakdown + Capacity Stress === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-1">Population Breakdown (Top 12)</h3>
          <p className="text-xs text-slate-500 mb-3">Stacked by vulnerable groups</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={popBreakdownData} margin={{ bottom: 40 }}>
              <XAxis dataKey="name" fontSize={9} angle={-40} textAnchor="end" interval={0} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Children" stackId="a" fill="#818cf8" />
              <Bar dataKey="Elderly" stackId="a" fill="#34d399" />
              <Bar dataKey="Disabled" stackId="a" fill="#fbbf24" />
              <Bar dataKey="Pregnant" stackId="a" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-1">Top 10 Capacity Stress</h3>
          <p className="text-xs text-slate-500 mb-3">Capacity utilization %</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={capacityTop10} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" domain={[0, 200]} fontSize={10} />
              <YAxis type="category" dataKey="name" fontSize={10} width={90} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Utilization']} />
              <Bar dataKey="util" radius={[0, 4, 4, 0]}>
                {capacityTop10.map((entry, i) => (
                  <Cell key={i} fill={entry.util > 120 ? '#dc2626' : entry.util > 100 ? '#ea580c' : '#ca8a04'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* === Relocation Status (only shown when relocations exist) === */}
      {relocatedCount > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Relocation Status — {relocatedCount} Habitation{relocatedCount > 1 ? 's' : ''} Relocated
          </h3>
          <p className="text-xs text-slate-500 mb-4">These habitations have been removed from active hazard zones and assigned to safe areas.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-5">
            {relocatedHabitations.map(h => (
              <div key={h.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-emerald-900 truncate">{h.name}</div>
                  <div className="text-xs text-emerald-700">{h.district}, {h.state}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    <span className="font-medium">→ {h._relocationPlan?.safeZoneName}</span>
                    <span className="text-slate-400 ml-2">Pop: {(h.population || 0).toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{h._relocationPlan?.timestamp}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Safe Zone Capacity Gauges */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm text-slate-700 mb-3">Safe Zone Occupancy Status</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {seedSafeZones
                .filter(sz => safeZoneCapacityUsed[sz.name] > 0)
                .map(sz => {
                  const assigned = safeZoneCapacityUsed[sz.name] || 0;
                  const peopleAssigned = relocatedHabitations
                    .filter(rh => rh._relocationPlan?.safeZoneName === sz.name)
                    .reduce((acc, rh) => acc + (rh.population || 0), 0);
                  const pct = Math.min(100, Math.round((peopleAssigned / Math.max(1, sz.available_capacity)) * 100));
                  return (
                    <div key={sz.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="font-semibold text-sm text-slate-800 mb-1">{sz.name}</div>
                      <div className="text-xs text-slate-500 mb-2">{sz.district} · Capacity: {sz.available_capacity?.toLocaleString()}</div>
                      <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                        <div className={`h-2 rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-orange-400' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{assigned} habitation{assigned > 1 ? 's' : ''} assigned</span>
                        <span>{pct}% occupied</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* === Full Data Table === */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800">Complete Habitations Dataset</h3>
            <p className="text-xs text-slate-500">Showing {tableData.length} of {totalHabs} habitations</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search name, district, state…"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
            </div>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MODERATE">Moderate</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-xs text-slate-600 uppercase sticky top-0">
              <tr>
                <SortTh field="name" label="Name" />
                <SortTh field="district" label="District" />
                <SortTh field="state" label="State" />
                <SortTh field="hazard_type" label="Hazard" />
                <SortTh field="risk_score" label="Risk Score" />
                <th className="px-3 py-2 font-semibold">Class</th>
                <SortTh field="population" label="Population" />
                <SortTh field="capacity_utilization" label="Cap %" />
                <th className="px-3 py-2 font-semibold">Priority</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((h, i) => {
                const isRelocated = relocatedIds.has(h.id);
                return (
                  <tr key={h.id}
                    className={`border-b transition-colors ${isRelocated ? 'bg-emerald-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`}>
                    <td className="px-3 py-2 font-medium">
                      <span className={isRelocated ? 'line-through text-slate-400' : ''}>{h.name}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{h.district}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs">{(h.state || '').split(' ').slice(-1)[0]}</td>
                    <td className="px-3 py-2 capitalize text-slate-600">{h.hazard_type}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-200 h-1.5 rounded-full">
                          <div className="h-1.5 rounded-full"
                            style={{ width: `${h.risk_score}%`, backgroundColor: RISK_COLORS[h.risk_class] || '#94a3b8' }} />
                        </div>
                        <span className="font-mono font-bold text-xs">{h.risk_score}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2"><RiskBadge riskClass={h.risk_class} /></td>
                    <td className="px-3 py-2 text-slate-700">{(h.population || 0).toLocaleString()}</td>
                    <td className={`px-3 py-2 font-medium text-xs ${(h.capacity_utilization || 0) > 120 ? 'text-red-600' : (h.capacity_utilization || 0) > 100 ? 'text-orange-500' : 'text-slate-600'}`}>
                      {h.capacity_utilization || 0}%
                    </td>
                    <td className="px-3 py-2"><PriorityBadge priority={h.relocation_priority} /></td>
                    <td className="px-3 py-2">
                      {isRelocated ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> {relocationPlans[h.id]?.safeZoneName}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Active</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {tableData.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-400">No habitations match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
