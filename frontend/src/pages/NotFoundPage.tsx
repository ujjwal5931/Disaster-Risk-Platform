import { Link } from 'react-router-dom';
import { Shield, Home, Map } from 'lucide-react';


export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-6">
        <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <div className="text-7xl font-black text-slate-200 mb-2">404</div>
        <h1 className="text-2xl font-bold text-slate-700 mb-2">Page Not Found</h1>
        <p className="text-slate-500 max-w-sm">
          The page you're looking for doesn't exist. Navigate back to the platform using the links below.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/" className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors">
          <Home className="w-4 h-4" /> Home
        </Link>
        <Link to="/dashboard" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Dashboard
        </Link>
        <Link to="/map" className="flex items-center gap-2 border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-100 transition-colors">
          <Map className="w-4 h-4" /> Risk Map
        </Link>
      </div>
    </div>
  );
}
