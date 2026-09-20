import { Shield, MapPin, Activity, Navigation, Zap, Award, Users, Code, Database } from 'lucide-react';


const TEAM = [
  { name: 'Team Lead / Backend', role: 'Python API + Risk Engine', icon: '👨‍💻' },
  { name: 'Frontend Developer', role: 'React + GIS + UI/UX', icon: '🎨' },
  { name: 'Data Analyst', role: 'Seed Data + Risk Modelling', icon: '📊' },
  { name: 'GIS Specialist', role: 'Spatial Analysis + Mapping', icon: '🗺️' },
];

const TECH = [
  { label: 'Frontend', items: ['React 18', 'TypeScript', 'Tailwind CSS', 'Vite', 'Zustand'] },
  { label: 'Mapping', items: ['Leaflet.js', 'React-Leaflet', 'OpenStreetMap'] },
  { label: 'Charts', items: ['Recharts', 'Radial Bar', 'Pie Chart', 'Bar Chart'] },
  { label: 'Backend', items: ['Python 3', 'Pure stdlib HTTP', 'SQLite', 'JSON REST API'] },
  { label: 'Algorithms', items: ['Weighted Risk Scoring', 'Haversine Distance', 'What-If Simulation', 'Multi-dim Capacity'] },
  { label: 'Deployment', items: ['Docker', 'Nginx', 'Railway / Render', 'Vercel'] },
];

const FEATURES = [
  { icon: <MapPin className="w-5 h-5" />, title: 'GIS Risk Map', desc: 'Leaflet + OpenStreetMap. 50 habitation markers, 10 red zone polygons, safe zone overlays. Layer controls and risk filters.' },
  { icon: <Activity className="w-5 h-5" />, title: 'Explainable Risk Scoring', desc: '7-factor weighted model: Hazard Severity, Exposure, Vulnerability, Infrastructure, History, Accessibility, Environment. Every score is explained.' },
  { icon: <Activity className="w-5 h-5" />, title: 'Carrying Capacity (7D)', desc: 'Water, Shelter, Healthcare, Road, Food, Sanitation, Safe Land. Utilization % + SAFE/STRESSED/OVERLOADED/CRITICAL status.' },
  { icon: <Navigation className="w-5 h-5" />, title: 'Relocation Planning', desc: 'P1–P4 priority ranking. Safe zone recommendations with distance (Haversine), safety score, capacity, and route quality.' },
  { icon: <Zap className="w-5 h-5" />, title: 'What-If Simulation', desc: '5 preset scenarios + 6 live sliders. Real-time before/after comparison. Risk escalation detection.' },
  { icon: <Users className="w-5 h-5" />, title: 'Population Vulnerability', desc: 'Children, elderly, disabled, pregnant women, BPL tracking. District-level stacked charts.' },
];

const PROBLEM = [
  { q: 'Where are the hazardous zones?', a: 'GIS Risk Map + Red Zone Polygons' },
  { q: 'Which habitations are in danger?', a: 'Risk scoring for all 50 habitations' },
  { q: 'Does safe carrying capacity exceed limits?', a: '7-dimension capacity engine' },
  { q: 'Who needs immediate relocation?', a: 'P1–P4 priority engine + safe zone matching' },
  { q: 'What happens if hazard worsens?', a: 'What-If simulation with 5 presets' },
];

export default function AboutPage() {
  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-xl p-8 mb-8">
        <div className="flex items-start gap-4">
          <Shield className="w-12 h-12 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <div className="text-xs text-blue-300 uppercase tracking-widest mb-2">Smart India Hackathon 2026 — SIH26191</div>
            <h1 className="text-2xl font-bold mb-2">Disaster Risk Intelligence Platform</h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Intelligent identification of hazard-based red zones, carrying capacity assessment,
              and immediate relocation needs for vulnerable habitations.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="bg-blue-700 text-blue-100 text-xs px-3 py-1 rounded-full">Category: Disaster Management</span>
              <span className="bg-blue-700 text-blue-100 text-xs px-3 py-1 rounded-full">GIS-based DSS</span>
              <span className="bg-blue-700 text-blue-100 text-xs px-3 py-1 rounded-full">Problem: SIH26191</span>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement Mapping */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" /> Problem Statement → Solution Mapping
        </h2>
        <div className="space-y-3">
          {PROBLEM.map((p, i) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
              <div className="flex-1">
                <div className="font-medium text-slate-800 text-sm">{p.q}</div>
                <div className="text-blue-600 text-xs mt-0.5">→ {p.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600" /> Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex gap-3 p-3 border rounded-lg hover:border-blue-300 transition-colors">
              <div className="text-blue-600 flex-shrink-0 mt-0.5">{f.icon}</div>
              <div>
                <div className="font-semibold text-sm text-slate-900">{f.title}</div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Novelty / Uniqueness */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">💡 Novelty & Uniqueness</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="font-bold text-green-800 mb-2">Explainable AI</div>
            <p className="text-green-700 text-xs">Every risk score is broken down factor-by-factor with contribution %, label, and plain-language description. No black box.</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="font-bold text-blue-800 mb-2">Zero Dependencies</div>
            <p className="text-blue-700 text-xs">Backend runs on pure Python 3 stdlib — no FastAPI, no pydantic, no pip installs needed. Works offline, deployable anywhere.</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="font-bold text-purple-800 mb-2">What-If Simulation</div>
            <p className="text-purple-700 text-xs">Planners can simulate flood level changes, population growth, or infrastructure improvements and instantly see risk impact — before it happens.</p>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" /> Technology Stack
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TECH.map(t => (
            <div key={t.label}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t.label}</div>
              <div className="flex flex-wrap gap-1">
                {t.items.map(item => (
                  <span key={item} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" /> Team
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TEAM.map((m, i) => (
            <div key={i} className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-3xl mb-2">{m.icon}</div>
              <div className="font-semibold text-sm text-slate-800">{m.name}</div>
              <div className="text-xs text-slate-500 mt-1">{m.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">🏗️ Architecture</h2>
        <div className="bg-slate-900 text-green-400 rounded-lg p-4 font-mono text-xs overflow-auto">
          <pre>{`
┌─────────────────────────────────────────────────────┐
│                    USER BROWSER                     │
│   React 18 + TypeScript + Tailwind + Leaflet        │
│   16 Pages  |  Zustand State  |  Recharts           │
└──────────────────┬──────────────────────────────────┘
                   │  REST API (JSON)
                   ▼
┌─────────────────────────────────────────────────────┐
│                PYTHON 3 BACKEND                     │
│   Pure stdlib http.server  |  Port 8000             │
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ │
│  │  Risk   │ │Capacity │ │Relocation│ │Simulate │ │
│  │ Engine  │ │ Engine  │ │ Engine   │ │ Engine  │ │
│  │7 factors│ │7 dims   │ │P1-P4     │ │What-If  │ │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └────┬────┘ │
│       └───────────┴───────────┴────────────┘       │
│                        │                           │
│                   SQLite DB                        │
│          50 Habitations | 10 Red Zones             │
│          10 Safe Zones  | 8 Alerts                 │
└─────────────────────────────────────────────────────┘
          `.trim()}</pre>
        </div>
      </div>

      {/* Risk Model */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">⚖️ Risk Scoring Model</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold mb-3 text-slate-700">7 Weighted Factors</div>
            {[
              ['Hazard Severity', '25%', 'bg-red-500'],
              ['Population Exposure', '20%', 'bg-orange-500'],
              ['Vulnerable Population', '15%', 'bg-yellow-500'],
              ['Infrastructure', '15%', 'bg-blue-500'],
              ['Historical Frequency', '10%', 'bg-purple-500'],
              ['Emergency Accessibility', '10%', 'bg-green-500'],
              ['Environmental Sensitivity', '5%', 'bg-teal-500'],
            ].map(([label, pct, color]) => (
              <div key={label as string} className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{}} ><div className={`w-2 h-2 rounded-full ${color}`}></div></div>
                <div className="flex-1 text-slate-700 text-xs">{label}</div>
                <div className="font-bold text-slate-900 w-8 text-right">{pct}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="font-semibold mb-3 text-slate-700">4 Risk Classes</div>
            {[
              ['LOW', '0–24', 'bg-green-100 text-green-800', 'Low hazard, good infrastructure'],
              ['MODERATE', '25–49', 'bg-yellow-100 text-yellow-800', 'Some hazard, needs monitoring'],
              ['HIGH', '50–74', 'bg-orange-100 text-orange-800', 'Significant risk, plan relocation'],
              ['CRITICAL', '75–100', 'bg-red-100 text-red-800', 'Immediate evacuation needed'],
            ].map(([cls, range, color, desc]) => (
              <div key={cls as string} className={`${color} rounded p-2 mb-2`}>
                <div className="flex justify-between font-bold text-xs">
                  <span>{cls}</span><span>{range}</span>
                </div>
                <div className="text-xs mt-0.5 opacity-80">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-900">
        <div className="font-bold mb-2">⚠️ Official Disclaimer</div>
        <p>This platform is a <strong>prototype decision-support system</strong> built for demonstration purposes as part of Smart India Hackathon 2026. All data, risk classifications, and relocation recommendations are based on <strong>synthetic demonstration data</strong> and simplified rule-based models. They must not be used for operational decisions without verification by qualified disaster management authorities and official geospatial data.</p>
        <div className="mt-3 text-xs text-amber-700">Category: Disaster Management | Problem Statement: SIH26191 | SIH 2026</div>
      </div>
    </div>
  );
}
