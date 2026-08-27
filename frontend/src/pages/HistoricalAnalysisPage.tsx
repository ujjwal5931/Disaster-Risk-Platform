import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { hazardEvents } from '../data/seedData';
import { PageHeader, Disclaimer } from '../components/ui';

export default function HistoricalAnalysisPage() {
  const chartData = [
    { year: 2018, Flood: 2, Industrial: 1, Cyclone: 0, Landslide: 0, Drought: 0 },
    { year: 2019, Cyclone: 1, Flood: 1, Industrial: 0, Landslide: 0, Drought: 0 },
    { year: 2020, Flood: 1, Cyclone: 1, Industrial: 0, Landslide: 0, Drought: 0 },
    { year: 2021, Landslide: 2, Flood: 0, Industrial: 0, Cyclone: 0, Drought: 0 },
    { year: 2022, Drought: 1, Flood: 1, Industrial: 0, Landslide: 0, Cyclone: 0 },
    { year: 2023, Cyclone: 1, Flood: 0, Industrial: 0, Landslide: 0, Drought: 0 },
    { year: 2024, Flood: 1, Cyclone: 0, Industrial: 0, Landslide: 0, Drought: 0 },
  ];

  const sortedEvents = [...hazardEvents].sort((a,b) => b.year - a.year);

  return (
    <div className="p-6">
      <PageHeader title="Historical Analysis" subtitle="Past event tracking and pattern recognition." />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-bold mb-4">Events per Year</h3>
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
            </BarChart>
          </div>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
            <strong>Future Risk:</strong> Based on historical frequency, flood risk is ELEVATED for the 2026-27 monsoon season.
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
