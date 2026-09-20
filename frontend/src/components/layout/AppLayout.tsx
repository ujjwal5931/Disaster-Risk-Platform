import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Shield, Map, AlertTriangle, Activity, Navigation, Zap, Users, Sliders, Bell, FileText, Upload, Clock, Settings, BarChart2, LogOut, Info } from 'lucide-react';
import { useStore } from '../../store/useStore';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/map', label: 'Risk Map', icon: Map },
  { to: '/red-zones', label: 'Red Zones', icon: AlertTriangle },
  { to: '/capacity', label: 'Carrying Capacity', icon: Activity },
  { to: '/relocation', label: 'Relocation', icon: Navigation },
  { to: '/hazards', label: 'Hazard Analysis', icon: Zap },
  { to: '/population', label: 'Population', icon: Users },
  { to: '/simulation', label: 'Simulation', icon: Sliders },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/upload', label: 'Data Upload', icon: Upload },
  { to: '/history', label: 'Historical', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/about', label: 'About / SIH', icon: Info },
];


export default function AppLayout() {
  const { user, logout, isDemoMode, toggleDemoMode } = useStore();
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-60 bg-slate-900 text-white flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          <div><div className="font-bold text-sm">DRIPS</div><div className="text-xs text-slate-400">Risk Platform</div></div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-1">{user?.username}</div>
          <div className="text-xs bg-slate-700 rounded px-2 py-0.5 inline-block capitalize">{user?.role}</div>
          <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mt-2"><LogOut className="w-3 h-3" /> Sign out</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 bg-white border-b flex items-center justify-between px-4 flex-shrink-0">
          <div className="text-sm text-slate-500">Disaster Risk Intelligence Platform — Demo</div>
          <div className="flex items-center gap-3">
            <button onClick={toggleDemoMode}
              className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                isDemoMode ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>Demo {isDemoMode ? 'ON' : 'OFF'}</button>
            <div className="w-7 h-7 bg-blue-600 rounded-full text-white text-xs flex items-center justify-center font-bold">{user?.username?.[0]?.toUpperCase()}</div>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
