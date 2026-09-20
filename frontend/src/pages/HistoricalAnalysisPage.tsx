import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { hazardEvents } from '../data/seedData';
import { PageHeader, KPICard, Disclaimer } from '../components/ui';
import { useHabitations } from '../hooks/useHabitations';

export default function HistoricalAnalysisPage() {
  const { allHabitations } = useHabitations();

  const syntheticEvents = allHabitations
    .filter(h => h.historical_event_count > 0)
    .map(h => ({
      year: h.last_event_year || 2022,
      hazard_type: h.hazard_type,
      districts: h.district,
      deaths: 0,
      displaced: Math.round(h.population * 0.1)
    }));

  const allMerged = [...hazardEvents, ...syntheticEvents];
  
  // Deduplicate by year + type + districts
  const dedupMap = new Map();
  allMerged.forEach(ev => {
    const key = `${ev.year}-${ev.hazard_type}-${ev.districts}`;
    if (!dedupMap.has(key)) {
      dedupMap.set(key, ev);
    }
  });
  const mergedEvents = Array.from(dedupMap.values());

  const yearMap: Record<number, any> = {};
  for (let y = 2015; y <= 2024; y++) {
    yearMap[y] = { year: y, flood: 0, cyclone: 0, landslide: 0, drought: 0, industrial: 0, earthquake: 0 };
  }

  const typeCounts: Record<string, number> = {};
  let totalDeaths = 0;
  let totalDisplaced = 0;

  mergedEvents.forEach(ev => {
    const y = ev.year;
    const type = ev.hazard_type.toLowerCase();
    if (yearMap[y] !== undefined && yearMap[y][type] !== undefined) {
      yearMap[y][type] += 1;
    }
    typeCounts[type] = (typeCounts[type] || 0) + 1;
    totalDeaths += ev.deaths;
    totalDisplaced += ev.displaced;
  });

  const chartData = Object.values(yearMap).map(d => ({
    year: d.year,
    Flood: d.flood,
    Cyclone: d.cyclone,
    Landslide: d.landslide,
    Drought: d.drought,
    Industrial: d.industrial,
    Earthquake: d.earthquake
  }));

  let maxType = 'flood';
  let maxCount = 0;
  Object.entries(typeCounts).forEach(([k, v]) => {
    if (v > maxCount) {
      maxCount = v;
      maxType = k;
    }
  });

  const sortedEvents = [...mergedEvents].sort((a,b) => b.year - a.year);

  return (
    <div className="p-6">
      <PageHeader title="Historical Analysis" subtitle="Past event tracking and pattern recognition." />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard label="Total Events" value={mergedEvents.length} color="blue" />
        <KPICard label="Total Deaths" value={totalDeaths.toLocaleString()} color="red" />
        <KPICard label="Total Displaced" value={totalDisplaced.toLocaleString()} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-bold mb-4">Events per Year (2015-2024)</h3>
          <div className="h-64">
            <BarChart width={500} height={250} data={chartData}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Flood" stackId="a" fill="#3b82f6" />
              <Bar dataKey="Cyclone" stackId="a" fill="#10b981" />
              <Bar dataKey="Landslide" stackId="a" fill="#ea580c" />
              <Bar dataKey="Drought" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Industrial" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="Earthquake" stackId="a" fill="#e11d48" />
            </BarChart>
          </div>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
            <strong>Future Risk:</strong> Based on historical frequency, <span className="uppercase font-bold">{maxType}</span> risk is ELEVATED.
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-[380px]">
          <div className="p-4 border-b bg-slate-50 font-bold">Event History Log</div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 uppercase text-xs text-slate-500 sticky top-0">
                <tr><th className="p-3">Year</th><th className="p-3">Type</th><th className="p-3">Districts</th><th className="p-3">Impact</th></tr>
              </thead>
              <tbody>
                {sortedEvents.map((ev, i) => (
                  <tr key={i} className="border-b hover:bg-slate-50">
                    <td className="p-3">{ev.year}</td>
                    <td className="p-3 capitalize">{ev.hazard_type}</td>
                    <td className="p-3">{ev.districts}</td>
                    <td className="p-3">
                      <div className="text-xs">
                        <span className="text-red-600 font-bold">{ev.deaths}</span> deaths
                        <br />
                        <span className="text-orange-600 font-bold">{ev.displaced.toLocaleString()}</span> displaced
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
