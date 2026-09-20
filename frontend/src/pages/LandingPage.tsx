import { Link, useNavigate } from 'react-router-dom';
import { Shield, MapPin, AlertTriangle, Activity, ChevronRight, Zap, Navigation, BarChart2 } from 'lucide-react';

const CAPABILITIES = [
  { icon: <MapPin className="w-6 h-6" />, title: 'GIS Risk Mapping', desc: 'Interactive geospatial risk maps with real-time hazard overlays and habitation markers.' },
  { icon: <AlertTriangle className="w-6 h-6" />, title: 'Red Zone Detection', desc: 'Automated identification of critical hazard zones using multi-factor risk models.' },
  { icon: <Activity className="w-6 h-6" />, title: 'Carrying Capacity', desc: 'Seven-dimension assessment of safe population capacity under disaster conditions.' },
  { icon: <Navigation className="w-6 h-6" />, title: 'Relocation Planning', desc: 'Priority-ranked relocation recommendations with safe zone matching and route planning.' },
  { icon: <Zap className="w-6 h-6" />, title: 'What-If Simulation', desc: 'Scenario simulation: see how changes in rainfall, population, or infrastructure affect risk.' },
  { icon: <BarChart2 className="w-6 h-6" />, title: 'Explainable AI', desc: 'Every risk score explained factor-by-factor with clear contribution breakdowns.' },
];

const HAZARDS = [
  { name: 'Flood', color: '#2563eb', emoji: '🌊' },
  { name: 'Landslide', color: '#92400e', emoji: '⛰️' },
  { name: 'Cyclone', color: '#7c3aed', emoji: '🌀' },
  { name: 'Drought', color: '#b45309', emoji: '☀️' },
  { name: 'Earthquake', color: '#dc2626', emoji: '🏚️' },
  { name: 'Wildfire', color: '#ea580c', emoji: '🔥' },
  { name: 'Industrial', color: '#64748b', emoji: '🏭' },
  { name: 'Multi-Hazard', color: '#7e22ce', emoji: '⚡' },
];

const STEPS = [
  { n: '01', title: 'Ingest Data', desc: 'Upload habitation, hazard, and infrastructure datasets (CSV, GeoJSON).' },
  { n: '02', title: 'Score Risk', desc: 'Weighted rule-based model scores each habitation across 7 risk dimensions.' },
  { n: '03', title: 'Detect Red Zones', desc: 'High-risk clusters are automatically identified and classified.' },
  { n: '04', title: 'Recommend Action', desc: 'System outputs relocation priorities and safe zone recommendations.' },
];

const STATS = [
  { label: 'Habitations Analysed', value: '50+', note: 'Demo dataset' },
  { label: 'Hazard Types Supported', value: '8', note: 'Including multi-hazard' },
  { label: 'Risk Dimensions', value: '7', note: 'Per assessment' },
  { label: 'Capacity Dimensions', value: '7', note: 'Per habitation' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <div className="font-bold text-lg leading-tight">Purva Drishti</div>
              <div className="text-xs text-slate-400">Disaster Risk Intelligence Platform</div>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded">SIH26191</span>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded font-medium transition-colors"
            >
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">
            Smart India Hackathon 2026 — Problem SIH26191
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-white">
            Purva Drishti — Disaster Risk Intelligence &<br />Safe Habitation Planning System
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-3xl">
            Intelligent identification of hazard-based red zones, carrying capacity stress, and immediate relocation needs
            for vulnerable habitations — powered by transparent, explainable risk models.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold transition-colors"
            >
              <BarChart2 className="w-5 h-5" />
              Enter Dashboard
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded font-semibold transition-colors"
            >
              <MapPin className="w-5 h-5" />
              Explore Risk Map
            </Link>
          </div>
          <div className="mt-8 text-xs text-slate-500 border border-slate-700 rounded p-3 max-w-2xl">
            ⚠️ <strong className="text-slate-400">Demo Mode:</strong> All data shown is synthetic demonstration data. Not for operational use. Use admin / admin123 to sign in.
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-700 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="font-medium mt-1">{s.label}</div>
              <div className="text-xs text-blue-200 mt-1">{s.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">System Capabilities</h2>
          <p className="text-slate-500 mb-8">End-to-end decision support from hazard identification to relocation action.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CAPABILITIES.map(c => (
              <div key={c.title} className="border rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="text-blue-600 mb-3">{c.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{c.title}</h3>
                <p className="text-sm text-slate-500">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hazards */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Supported Hazard Types</h2>
          <p className="text-slate-500 mb-8">Multi-hazard analysis covering all major natural and industrial hazards affecting India.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {HAZARDS.map(h => (
              <div key={h.name} className="bg-white border rounded-lg p-4 text-center hover:shadow-sm transition-shadow">
                <div className="text-3xl mb-2">{h.emoji}</div>
                <div className="font-medium text-slate-900">{h.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How the System Works</h2>
          <p className="text-slate-500 mb-8">A transparent, step-by-step workflow from raw data to actionable decisions.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-blue-100 z-0" />
                )}
                <div className="relative bg-slate-50 border rounded-lg p-5">
                  <div className="text-2xl font-bold text-blue-600 mb-3">{s.n}</div>
                  <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-12 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Ready to Explore the Platform?</h2>
          <p className="text-slate-400 mb-6">Access the full demonstration with pre-loaded disaster risk data across 50 habitations.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded font-semibold transition-colors"
          >
            Enter Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="bg-slate-950 text-slate-400 py-6 px-6 text-center text-sm">
        <div className="max-w-5xl mx-auto">
          <p className="text-slate-500 mb-2">
            ⚠️ <strong>Official Disclaimer:</strong> This platform is a decision-support prototype. Risk classifications and relocation recommendations
            must be validated by authorized disaster-management authorities and verified against official field and geospatial data before operational use.
          </p>
          <p className="text-xs text-slate-600 mt-2">
            Category: Disaster Management | Smart India Hackathon 2026 | SIH26191
          </p>
        </div>
      </footer>
    </div>
  );
}
