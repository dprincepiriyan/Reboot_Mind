import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Shield, Server } from 'lucide-react';
import { authApi } from '../api/auth';
import { authStorage } from '../lib/authStorage';
import { useServerUrl } from '../hooks/useServerUrl';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const serverUrl = useServerUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await authApi.login(email, password);
      authStorage.setToken(res.access_token);
      onLoginSuccess();
      navigate('/chatrooms');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to login');
      } else {
        setError('Failed to login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="glass-card max-w-sm w-full rounded-3xl p-7 border border-white/[0.06] shadow-surface-lg space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400 text-xl font-black mx-auto shadow-surface-sm">
            R
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Welcome to RebootMind</h2>
          <p className="text-xs text-slate-400">
            RebootMind · Encrypted Peer Recovery
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-dark-900 border border-slate-700/70 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/80 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-900 border border-slate-700/70 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/80 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-brand-950/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400 border-t border-white/[0.05]">
          Need an account?{' '}
          <Link to="/signup" className="text-brand-400 font-semibold hover:underline">
            Create Anonymous Account
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
          <Shield className="w-3.5 h-3.5 text-brand-400" />
          <span>No real names stored or revealed to peers</span>
        </div>

        <Link
          id="login-server-settings"
          to="/connect"
          className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 hover:text-brand-400 transition-colors"
        >
          <Server className="w-3 h-3" />
          <span>Server: {serverUrl || 'this site'} · Change</span>
        </Link>
      </div>
    </div>
  );
};
