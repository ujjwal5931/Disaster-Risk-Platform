export const getRiskColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'LOW': return 'text-risk-low';
    case 'MODERATE': return 'text-risk-moderate';
    case 'HIGH': return 'text-risk-high';
    case 'CRITICAL': return 'text-risk-critical';
    default: return 'text-slate-500';
  }
};

export const getRiskBgColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'LOW': return 'bg-risk-low text-white';
    case 'MODERATE': return 'bg-risk-moderate text-white';
    case 'HIGH': return 'bg-risk-high text-white';
    case 'CRITICAL': return 'bg-risk-critical text-white';
    default: return 'bg-slate-500 text-white';
  }
};

export const getRiskHexColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'LOW': return '#16a34a';
    case 'MODERATE': return '#ca8a04';
    case 'HIGH': return '#ea580c';
    case 'CRITICAL': return '#dc2626';
    default: return '#64748b';
  }
};
