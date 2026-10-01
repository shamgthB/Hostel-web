import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, KeyRound, Mail, AlertCircle, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please enter both your email/username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Building2 className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-stone-900">
          Hostel Management System
        </h2>
        <p className="mt-1 text-center text-sm text-stone-600">
          Secure digital portal for Owners and Residents
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-stone-200 rounded-2xl sm:px-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-identifier" className="block text-xs font-semibold text-stone-700">
                Email or Username
              </label>
              <div className="mt-1 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="admin@hostel.com or resident@hostel.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-stone-900 bg-white placeholder-stone-400"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-stone-700">
                Password
              </label>
              <div className="mt-1 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-stone-900 bg-white placeholder-stone-400"
                  required
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-6 pt-5 border-t border-stone-200">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 text-center">
              Quick Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="demo-owner-btn"
                type="button"
                onClick={() => setDemoCredentials('admin@hostel.com', 'admin123')}
                className="p-2.5 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 rounded-lg text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 group-hover:text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Owner / Admin
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5 font-mono">admin@hostel.com</div>
              </button>

              <button
                id="demo-resident-btn"
                type="button"
                onClick={() => setDemoCredentials('rahul@hostel.com', 'resident123')}
                className="p-2.5 bg-stone-50 hover:bg-sky-50 border border-stone-200 hover:border-sky-300 rounded-lg text-left transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 group-hover:text-sky-700">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  Resident (101)
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5 font-mono">rahul@hostel.com</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-stone-500">
            Need to register a new hostel?{' '}
            <button
              id="switch-to-register-btn"
              onClick={onSwitchToRegister}
              className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              Create Owner Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
