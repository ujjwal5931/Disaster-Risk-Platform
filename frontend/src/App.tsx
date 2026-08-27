import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import RiskMapPage from './pages/RiskMapPage';
import RedZonesPage from './pages/RedZonesPage';
import CarryingCapacityPage from './pages/CarryingCapacityPage';
import RelocationPage from './pages/RelocationPage';
import HazardAnalysisPage from './pages/HazardAnalysisPage';
import PopulationVulnerabilityPage from './pages/PopulationVulnerabilityPage';
import SimulationPage from './pages/SimulationPage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import DataUploadPage from './pages/DataUploadPage';
import HistoricalAnalysisPage from './pages/HistoricalAnalysisPage';
import SettingsPage from './pages/SettingsPage';
import HabitationDetailPage from './pages/HabitationDetailPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<RiskMapPage />} />
          <Route path="/red-zones" element={<RedZonesPage />} />
          <Route path="/capacity" element={<CarryingCapacityPage />} />
          <Route path="/relocation" element={<RelocationPage />} />
          <Route path="/hazards" element={<HazardAnalysisPage />} />
          <Route path="/population" element={<PopulationVulnerabilityPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/upload" element={<DataUploadPage />} />
          <Route path="/history" element={<HistoricalAnalysisPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/habitation/:id" element={<HabitationDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
