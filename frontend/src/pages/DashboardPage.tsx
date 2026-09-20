import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { PageHeader, KPICard, Disclaimer, RiskBadge, PriorityBadge } from '../components/ui';
import { alerts } from '../data/seedData';
import { getRiskHexColor } from '../utils/riskColors';
import { useHabitations } from '../hooks/useHabitations';

export default function DashboardPage() {
  const { allHabitations } = useHabitations();


  const totalHabs = allHabitations.length;
  const highRisk = allHabitations.filter(h => h.risk_class === 'HIGH').length;
  const criticalRisk = allHabitations.filter(h => h.risk_class === 'CRITICAL').length;
  const capExceeded = allHabitations.filter(h => h.capacity_utilization > 100).length;
  const immediateP1 = allHabitations.filter(h => h.relocation_priority === 'P1-IMMEDIATE').length;
  const popAtRisk = allHabitations.filter(h => h.risk_class === 'HIGH' || h.risk_class === 'CRITICAL')
    .reduce((acc, h) => acc + h.population, 0);

  const pieData = [
    { name: 'CRITICAL', value: criticalRisk },
    { name: 'HIGH', value: highRisk },
    { name: 'MODERATE', value: allHabitations.filter(h => h.risk_class === 'MODERATE').length },
    { name: 'LOW', value: allHabitations.filter(h => h.risk_class === 'LOW').length },
  ];

  const hazards = allHabitations.reduce((acc, h) => {
    acc[h.hazard_type] = (acc[h.hazard_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const barData = Object.keys(hazards).map(k => ({ name: k.toUpperCase(), count: hazards[k] }));

  const top10 = [...allHabitations].sort((a, b) => b.risk_score - a.risk_score).slice(0, 10);
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
                  <Cell key={`cell-${index}`} fill={getRiskHexColor(entry.name)} />
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
                    <td><Link to={`/habitation/${h.id}`} className="text-blue-600 hover:underline">View</Link></td>
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
}