import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { seedHabitations, hazardEvents } from '../data/seedData';
import { PageHeader, Disclaimer } from '../components/ui';

export default function HazardAnalysisPage() {
  const [tab, setTab] = useState('Overview');

  const hazardCounts = seedHabitations.reduce((acc, h) => {
    acc[h.hazard_type] = (acc[h.hazard_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const barData = Object.keys(hazardCounts).map(k => ({ name: k.toUpperCase(), count: hazardCounts[k] }));

  const radarData = [
    { subject: 'Flood', A: 85, fullMark: 100 },
    { subject: 'Landslide', A: 40, fullMark: 100 },
    { subject: 'Cyclone', A: 20, fullMark: 100 },
    { subject: 'Drought', A: 10, fullMark: 100 },
    { subject: 'Industrial', A: 60, fullMark: 100 },
    { subject: 'Earthquake', A: 50, fullMark: 100 },
  ];

  return (
    <div className="p-6">
      <PageHeader title="Hazard Analysis" subtitle="Multi-hazard profiling and event history." />
      
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
          <div className="flex justify-center">
            <div className="text-center">
              <h3 className="font-bold mb-4">Sample Radar (Rampur)</h3>
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
              {hazardEvents.map((ev, i) => (
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