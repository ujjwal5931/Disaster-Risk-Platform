import { useState, useMemo } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { hazardEvents } from '../data/seedData';
import { PageHeader, Disclaimer, KPICard } from '../components/ui';
import { useHabitations } from '../hooks/useHabitations';

export default function HazardAnalysisPage() {
  const [tab, setTab] = useState('Overview');
  const { allHabitations } = useHabitations();
  const [selectedHabId, setSelectedHabId] = useState(allHabitations[0]?.id || '');

  const { hazardCounts, barData, totalPop, dominantHazard } = useMemo(() => {
    let pop = 0;
    const counts: Record<string, number> = {};
    allHabitations.forEach(h => {
      pop += h.population;
      counts[h.hazard_type] = (counts[h.hazard_type] || 0) + 1;
    });
    
    let maxCount = 0;
    let dom = '';
    Object.entries(counts).forEach(([k, v]) => {
      if (v > maxCount) {
        maxCount = v;
        dom = k;
      }
    });

    const bData = Object.keys(counts).map(k => ({ name: k.toUpperCase(), count: counts[k] }));
    return { hazardCounts: counts, barData: bData, totalPop: pop, dominantHazard: dom };
  }, [allHabitations]);

  const selectedHab = allHabitations.find(h => h.id === selectedHabId) || allHabitations[0];

  const radarData = useMemo(() => {
    if (!selectedHab) return [];
    const floodVal = selectedHab.hazard_type === 'flood'
      ? Math.round(selectedHab.hazard_severity * (selectedHab.hazard_severity <= 1 ? 100 : 1))
      : 10;
    const rainfall = selectedHab.rainfall_annual_mm ?? selectedHab.annual_rainfall_mm ?? 800;
    return [
      { subject: 'Flood', A: floodVal, fullMark: 100 },
      { subject: 'Landslide', A: Math.min(100, (selectedHab.slope_degrees / 40) * 100), fullMark: 100 },
      { subject: 'Cyclone', A: selectedHab.is_coastal ? 80 : 0, fullMark: 100 },
      { subject: 'Drought', A: Math.max(0, 100 - (rainfall / 30)), fullMark: 100 },
      { subject: 'Infrastructure', A: Math.max(0, (5 - selectedHab.housing_quality_index) / 4 * 100), fullMark: 100 },
      { subject: 'Accessibility', A: Math.min(100, (selectedHab.evacuation_route_quality / 5) * 100), fullMark: 100 },
    ];
  }, [selectedHab]);

  const allEvents = useMemo(() => {
    const syntheticEvents = allHabitations
      .filter(h => h.historical_event_count > 0)
      .map(h => ({
        year: h.last_event_year || 2022,
        hazard_type: h.hazard_type,
        districts: h.district,
        deaths: 0,
        displaced: Math.round(h.population * 0.1)
      }));
    return [...hazardEvents, ...syntheticEvents].sort((a, b) => b.year - a.year);
  }, [allHabitations]);

  return (
    <div className="p-6">
      <PageHeader title="Hazard Analysis" subtitle="Multi-hazard profiling and event history." />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard label="Total Habitations" value={allHabitations.length} color="blue" />
        <KPICard label="Total Population" value={totalPop.toLocaleString()} color="orange" />
        <KPICard label="Dominant Hazard" value={dominantHazard.toUpperCase()} color="red" />
      </div>

      <div className="flex border-b mb-6">
        {['Overview', 'Multi-Hazard Profile', 'Event History'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t}</button>
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
          <div className="flex flex-col items-center">
            <select 
              className="mb-4 p-2 border rounded" 
              value={selectedHabId} 
              onChange={e => setSelectedHabId(e.target.value)}
            >
              {allHabitations.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <div className="text-center">
              <h3 className="font-bold mb-4">Radar: {selectedHab?.name}</h3>
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
              {allEvents.map((ev, i) => (
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
}
