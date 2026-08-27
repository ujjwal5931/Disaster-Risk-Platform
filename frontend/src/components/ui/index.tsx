import { getRiskHexColor } from '../../utils/riskColors';

export function RiskBadge({ riskClass }: { riskClass: string }) {
  const cls = riskClass?.toUpperCase();
  const colors: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800 border-green-200',
    MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colors[cls] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {riskClass}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    'P1-IMMEDIATE': 'bg-red-600 text-white',
    'P2-URGENT': 'bg-orange-500 text-white',
    'P3-PLANNED': 'bg-yellow-500 text-white',
    'P4-MONITOR': 'bg-blue-500 text-white',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[priority] ?? 'bg-slate-400 text-white'}`}>
      {priority}
    </span>
  );
}

export function CapacityBar({ utilization, status }: { utilization: number; status: string }) {
  const colors: Record<string, string> = {
    SAFE: 'bg-green-500', STRESSED: 'bg-yellow-500', OVERLOADED: 'bg-orange-500', CRITICAL: 'bg-red-500'
  };
  return (
    <div className="w-full bg-slate-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${colors[status] ?? 'bg-blue-500'}`}
        style={{ width: `${Math.min(utilization, 100)}%` }}
      />
    </div>
  );
}

export function Disclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-800 flex items-start gap-2 mt-4">
      <span>⚠️</span>
      <span><strong>Demonstration data only.</strong> Risk classifications and recommendations shown here must be validated by authorized disaster-management authorities and verified against official geospatial data before operational use.</span>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

export function KPICard({ label, value, sub, color = 'blue' }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'border-l-blue-500', red: 'border-l-red-500', orange: 'border-l-orange-500',
    green: 'border-l-green-500', yellow: 'border-l-yellow-500', purple: 'border-l-purple-500',
  };
  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border border-slate-200 border-l-4 ${colors[color] ?? colors.blue}`}>
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function RiskDot({ riskClass }: { riskClass: string }) {
  const color = getRiskHexColor(riskClass);
  return <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />;
}
