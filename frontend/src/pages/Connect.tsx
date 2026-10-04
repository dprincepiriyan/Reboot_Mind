import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Server, CheckCircle2, XCircle, Loader2, ArrowRight, RotateCcw, Info } from 'lucide-react';
import {
  clearServerUrl,
  getServerUrl,
  normalizeServerUrl,
  setServerUrl,
  testServer,
  ServerCheckResult,
} from '../config/server';
import { isNative } from '../lib/platform';

/**
 * Lets the user point RebootMind at the host PC on the local Wi-Fi.
 * Shown automatically on first launch of the Android app.
 */
export const Connect: React.FC = () => {
  const navigate = useNavigate();
  const current = getServerUrl();
  const [address, setAddress] = useState(current ?? '');
  const [status, setStatus] = useState<'idle' | 'testing' | 'done'>('idle');
  const [result, setResult] = useState<ServerCheckResult | null>(null);

  const preview = address.trim() ? normalizeServerUrl(address) : '';

  const runTest = async (): Promise<boolean> => {
    if (!preview) return false;
    setStatus('testing');
    const res = await testServer(preview);
    setResult(res);
    setStatus('done');
    return res.ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await runTest();
    if (ok) {
      setServerUrl(preview);
      navigate('/', { replace: true });
    }
  };

  const handleUseSameOrigin = () => {
    clearServerUrl();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="glass-card max-w-sm w-full rounded-3xl p-7 border border-white/[0.06] shadow-surface-lg space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400 mx-auto shadow-surface-sm">
            <Wifi className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Connect to RebootMind</h1>
          <p className="text-xs text-slate-400">
            Enter the address of the PC running the RebootMind server on your Wi-Fi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label htmlFor="connect-server-address" className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Server Address
            </label>
            <div className="relative">
              <Server className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                id="connect-server-address"
                type="text"
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                required
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setStatus('idle');
                  setResult(null);
                }}
                placeholder="192.168.1.10:8000"
                className="w-full bg-dark-900 border border-slate-700/70 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/80 transition-colors"
              />
            </div>
            {preview && (
              <p className="text-[10px] text-slate-500 pl-1">
                Will connect to <span className="text-slate-300 font-mono">{preview}</span>
              </p>
            )}
          </div>

          {status === 'done' && result && (
            <div
              id="connect-result"
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                result.ok
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              {result.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              <span>{result.ok ? `Connected to ${result.app ?? 'server'}` : result.error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              id="connect-test"
              type="button"
              onClick={runTest}
              disabled={!preview || status === 'testing'}
              className="flex-1 py-2.5 rounded-xl bg-dark-850 border border-slate-700/70 hover:border-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              {status === 'testing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Test</span>
            </button>
            <button
              id="connect-save"
              type="submit"
              disabled={!preview || status === 'testing'}
              className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-brand-950/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
            >
              <span>Save & Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {!isNative() && (
          <button
            id="connect-use-same-origin"
            type="button"
            onClick={handleUseSameOrigin}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-brand-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Use this website's server (default)</span>
          </button>
        )}

        <div className="pt-3 border-t border-white/[0.05] space-y-1.5 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
            <Info className="w-3.5 h-3.5 text-brand-400" />
            <span>Can't connect?</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>Phone and PC must be on the same Wi-Fi.</li>
            <li>The PC address is printed when the server starts.</li>
            <li>Allow port 8000 through the Windows Firewall.</li>
            <li>Guest/campus Wi-Fi may block devices; try a hotspot.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
