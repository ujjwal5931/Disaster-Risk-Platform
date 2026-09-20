import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Disclaimer } from '../components/ui';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await login(username, password)) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-slate-800 p-6 text-center text-white border-b-4 border-blue-500">
          <Shield className="w-12 h-12 mx-auto text-blue-400 mb-2" />
          <h1 className="text-2xl font-bold tracking-tight">Purva Drishti</h1>
          <p className="text-sm text-slate-300">Disaster Risk Intelligence Platform</p>
          <div className="text-xs mt-2 uppercase tracking-widest text-slate-400">Authorized Access Only</div>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded border border-red-200">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition-colors">Sign In</button>
          </form>
          
          <div className="mt-6 bg-slate-50 p-4 rounded border text-sm text-slate-600">
            <div className="font-bold mb-2">Demo Credentials:</div>
            <ul className="space-y-1">
              <li><strong>Admin:</strong> admin / admin123</li>
              <li><strong>Officer:</strong> officer / officer123</li>
              <li><strong>Viewer:</strong> viewer / viewer123</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-8 max-w-md">
        <Disclaimer />
      </div>
    </div>
  );
}
