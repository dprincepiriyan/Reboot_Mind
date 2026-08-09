import React, { useEffect, useState } from 'react';
import { Flame, RotateCcw, CheckCircle2, Calendar, Award, BarChart3, TrendingUp, Compass } from 'lucide-react';
import { sobrietyApi, SobrietyStatus, SobrietyLog, SobrietySummary } from '../api/sobriety';
import { StreakBadge } from '../components/StreakBadge';
import { TriggerDashboard } from '../components/TriggerDashboard';

export const SobrietyDashboard: React.FC = () => {
  const [status, setStatus] = useState<SobrietyStatus | null>(null);
  const [summary, setSummary] = useState<SobrietySummary | null>(null);
  const [logs, setLogs] = useState<SobrietyLog[]>([]);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState<'tracker' | 'insights'>('tracker');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);

  const fetchStatus = async () => {
    try {
      const [statusData, logsData, summaryData] = await Promise.all([
        sobrietyApi.getStatus(),
        sobrietyApi.getLogs(),
        sobrietyApi.getSummary(),
      ]);
      setStatus(statusData);
      setLogs(logsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load sobriety data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleAction = async (type: 'start' | 'reset' | 'checkin') => {
    try {
      await sobrietyApi.logEvent(type, note || undefined);
      setNote('');
      await fetchStatus();
    } catch (err) {
      console.error('Failed to log sobriety event:', err);
      setError('Failed to log event. Please try again.');
    }
  };

  const handleSlip = async () => {
    try {
      await sobrietyApi.logRelapse();
      setShowSlipModal(false);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to log slip:', err);
      setError('Failed to log event. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="h-44 glass-card rounded-3xl animate-pulse"></div>
        <div className="h-64 glass-card rounded-3xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24 relative">
      {/* Premium Tab Navigation */}
      <div className="flex bg-dark-900/60 p-1.5 rounded-2xl border border-slate-800/80">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
            activeTab === 'tracker'
              ? 'bg-slate-800 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>Sobriety Tracker</span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
            activeTab === 'insights'
              ? 'bg-slate-800 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Trigger Insights</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">
          {error}
        </div>
      )}

      {activeTab === 'tracker' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Streak Overview & Aggregates */}
          <div className="glass-card rounded-3xl p-6 text-center border border-emerald-500/30 relative overflow-hidden shadow-2xl">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40 mb-3">
              <Flame className="w-8 h-8 animate-pulse" />
            </div>

            <div className="text-4xl font-extrabold text-white tracking-tight">
              {summary?.current_streak_days || 0}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mt-0.5">
              Current Streak Days
            </div>

            {/* Split Stats: Longest Streak & Total Checkins */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800/80">
              <div className="text-left bg-dark-900/40 p-3 rounded-xl border border-slate-800/40">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Longest Streak</div>
                <div className="text-lg font-black text-white mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  {summary?.longest_streak_days || 0} days
                </div>
              </div>
              <div className="text-left bg-dark-900/40 p-3 rounded-xl border border-slate-800/40">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Check-Ins</div>
                <div className="text-lg font-black text-white mt-0.5">
                  {summary?.total_checkins || 0} times
                </div>
              </div>
            </div>

            {/* Actions & Check-In reflection note */}
            <div className="mt-5 pt-4 border-t border-slate-850 space-y-3">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a daily reflection or note (optional)..."
                className="w-full bg-dark-900/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
              />

              <div className="flex gap-2">
                <button
                  disabled={status?.checkin_today}
                  onClick={() => handleAction('checkin')}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{status?.checkin_today ? 'Checked In Today' : 'Daily Check-In'}</span>
                </button>

                <button
                  onClick={() => setShowSlipModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all duration-200"
                  title="Log a slip honestly without shame"
                >
                  I slipped
                </button>
              </div>
            </div>
          </div>

          {/* Milestone Badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Milestone Achievements</h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {status?.badges.map((badge) => (
                <StreakBadge key={badge.id} badge={badge} />
              ))}
            </div>
          </div>

          {/* Activity Logs */}
          {logs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Recent Activity Log</h3>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-dark-800/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                        log.event_type === 'start' ? 'bg-emerald-500/20 text-emerald-300' :
                        log.event_type === 'reset' ? 'bg-red-500/20 text-red-300' :
                        log.event_type === 'relapse' ? 'bg-amber-500/20 text-amber-300' :
                        log.event_type === 'craving' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {log.event_type}
                      </span>
                      <span className="text-slate-300">
                        {log.trigger_tag ? `Trigger: ${log.trigger_tag}` : log.note || 'No note attached'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.event_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          <TriggerDashboard onCravingLogged={fetchStatus} />
        </div>
      )}

      {/* Honest slip modal */}
      {showSlipModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative overflow-hidden animate-scale-up">
            <h3 className="text-base font-extrabold text-white">Log a slip honestly</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We all face setbacks on the road to recovery. Logging a slip resets your current streak, but does **not** wipe out your overall progress, longest streak, or total check-ins.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSlipModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Go Back
              </button>
              <button
                onClick={handleSlip}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold transition-all"
              >
                Log Slip & Keep Going
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
