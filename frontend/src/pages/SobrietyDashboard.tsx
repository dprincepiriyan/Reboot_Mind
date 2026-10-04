import React, { useEffect, useState } from 'react';
import { Flame, RotateCcw, CheckCircle2, Calendar, Award, BarChart3, TrendingUp, Compass, FileText } from 'lucide-react';
import { sobrietyApi, SobrietyStatus, SobrietyLog, SobrietySummary } from '../api/sobriety';
import { StreakBadge } from '../components/StreakBadge';
import { TriggerDashboard } from '../components/TriggerDashboard';
import { WeeklyReportModal } from '../components/WeeklyReportModal';

export const SobrietyDashboard: React.FC = () => {
  const [status, setStatus] = useState<SobrietyStatus | null>(null);
  const [summary, setSummary] = useState<SobrietySummary | null>(null);
  const [logs, setLogs] = useState<SobrietyLog[]>([]);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState<'tracker' | 'insights'>('tracker');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

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
    if (isActionLoading) return;
    setIsActionLoading(true);
    try {
      await sobrietyApi.logEvent(type, note || undefined);
      setNote('');
      await fetchStatus();
    } catch (err) {
      console.error('Failed to log sobriety event:', err);
      setError('Failed to log event. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSlip = async () => {
    if (isActionLoading) return;
    setIsActionLoading(true);
    try {
      await sobrietyApi.logRelapse();
      setShowSlipModal(false);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to log slip:', err);
      setError('Failed to log event. Please try again.');
    } finally {
      setIsActionLoading(false);
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
    <div className="max-w-md mx-auto p-4 space-y-5 pb-28 relative font-sans animate-fade-in">
      {/* Segmented Tab Navigation */}
      <div className="flex bg-dark-900/90 p-1 rounded-2xl border border-white/[0.06] shadow-surface-sm">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex-1 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
            activeTab === 'tracker'
              ? 'bg-dark-800 text-white shadow-surface-sm border border-white/[0.08]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-brand-400" />
          <span>Sobriety Counter</span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-2 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
            activeTab === 'insights'
              ? 'bg-dark-800 text-white shadow-surface-sm border border-white/[0.08]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Trigger Insights</span>
        </button>
      </div>

      {/* Weekly Report Button */}
      <button
        onClick={() => setShowReport(true)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-violet-500/20 text-violet-300 text-xs font-semibold transition-all shadow-surface-sm"
      >
        <FileText className="w-3.5 h-3.5 text-violet-400" />
        <span>View Weekly Progress Report</span>
      </button>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {activeTab === 'tracker' ? (
        <div className="space-y-5 animate-fade-in">
          {/* Streak Overview & Serene Halo */}
          <div className="glass-card rounded-3xl p-6 text-center border border-brand-500/20 relative overflow-hidden shadow-surface-lg">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Concentric Halo Ring */}
            <div className="relative w-36 h-36 mx-auto my-2 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-brand-500/20 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full border border-brand-500/30"></div>
              <div className="absolute inset-4 rounded-full bg-gradient-to-b from-brand-500/15 via-dark-850 to-dark-900 flex flex-col items-center justify-center shadow-inner">
                <Flame className="w-5 h-5 text-amber-400 mb-0.5" />
                <span className="text-4xl font-black text-white tracking-tight">
                  {summary?.current_streak_days || 0}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {summary?.current_streak_days === 1 ? 'Day Clear' : 'Days Clear'}
                </span>
              </div>
            </div>

            <div className="text-xs font-medium text-slate-300 mt-1">
              Continuous Neurochemical Recovery
            </div>

            {/* Split Stats: Longest Streak & Total Checkins */}
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/[0.05]">
              <div className="text-left bg-dark-900/60 p-3 rounded-2xl border border-white/[0.04]">
                <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Longest Streak</div>
                <div className="text-base font-bold text-white mt-0.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
                  <span>{summary?.longest_streak_days || 0} days</span>
                </div>
              </div>
              <div className="text-left bg-dark-900/60 p-3 rounded-2xl border border-white/[0.04]">
                <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Check-Ins</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {summary?.total_checkins || 0} times
                </div>
              </div>
            </div>

            {/* Actions & Check-In reflection note */}
            <div className="mt-5 pt-4 border-t border-white/[0.05] space-y-2.5">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="How are you feeling today? (Optional reflection)..."
                className="w-full bg-dark-900/80 border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/80 transition-colors"
              />

              <div className="flex gap-2">
                <button
                  disabled={status?.checkin_today || isActionLoading}
                  onClick={() => handleAction('checkin')}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-brand-950/30 transition-all active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>
                    {isActionLoading
                      ? 'Saving...'
                      : status?.checkin_today
                      ? 'Checked In Today'
                      : 'Log Daily Check-In'}
                  </span>
                </button>

                <button
                  onClick={() => setShowSlipModal(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-dark-900 hover:bg-dark-850 border border-slate-700/70 text-slate-300 text-xs font-semibold transition-all active:scale-98"
                  title="Log a slip honestly without shame"
                >
                  I slipped
                </button>
              </div>
            </div>
          </div>

          {/* Milestone Badges */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">Milestone Achievements</h3>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {status?.badges.map((badge) => (
                <StreakBadge key={badge.id} badge={badge} />
              ))}
            </div>
          </div>

          {/* Activity Logs */}
          {logs.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">Recent Activity</h3>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-dark-900/60 border border-white/[0.04] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] tracking-wide ${
                        log.event_type === 'start' ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20' :
                        log.event_type === 'reset' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' :
                        log.event_type === 'relapse' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
                        log.event_type === 'craving' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20' : 'bg-teal-500/15 text-teal-300 border border-teal-500/20'
                      }`}>
                        {log.event_type}
                      </span>
                      <span className="text-slate-300 truncate max-w-[200px]">
                        {log.trigger_tag ? `Trigger: ${log.trigger_tag}` : log.note || 'No reflection note'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
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
          <TriggerDashboard
            onCravingLogged={fetchStatus}
            onSlipRequested={() => setShowSlipModal(true)}
          />
        </div>
      )}

      {/* Honest slip modal */}
      {showSlipModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-white/[0.08] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-surface-lg relative overflow-hidden animate-scale-up">
            <h3 className="text-base font-bold text-white">Log a slip with self-compassion</h3>
            <p className="text-xs text-slate-300/90 leading-relaxed">
              Recovery is nonlinear. Logging a slip resets your current streak counter, but does <strong className="text-white font-semibold">not</strong> erase your neural progress, longest streak, or past check-ins.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                disabled={isActionLoading}
                onClick={() => setShowSlipModal(false)}
                className="flex-1 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 border border-white/[0.06] disabled:opacity-50 text-slate-300 text-xs font-semibold transition-all active:scale-98"
              >
                Go Back
              </button>
              <button
                disabled={isActionLoading}
                onClick={handleSlip}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-dark-950 text-xs font-bold transition-all active:scale-98 shadow-md shadow-amber-950/30"
              >
                {isActionLoading ? 'Logging...' : 'Reset & Recommit'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showReport && <WeeklyReportModal onClose={() => setShowReport(false)} />}
    </div>
  );
};
