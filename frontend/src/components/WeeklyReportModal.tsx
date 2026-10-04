import React, { useEffect, useState } from 'react';
import { BarChart3, X, Flame, TrendingUp, CheckSquare, Zap, AlertTriangle, Calendar, Star, ChevronRight } from 'lucide-react';
import { reportsApi, WeeklyReport } from '../api/reports';

const TRIGGER_LABELS: Record<string, string> = {
  stress: '😤 Stress',
  social: '👥 Social',
  boredom: '😑 Boredom',
  loneliness: '😶 Loneliness',
  fatigue: '😴 Fatigue',
  celebration: '🎉 Celebration',
  anxiety: '😰 Anxiety',
  anger: '😡 Anger',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyReportModalProps {
  onClose: () => void;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ onClose }) => {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await reportsApi.getWeeklyReport();
        setReport(data);
      } catch {
        setError('Failed to load your weekly report.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const weekDays = report
    ? Object.keys(report.daily_checkin_map)
        .sort()
        .map(dateStr => {
          const d = new Date(dateStr);
          return {
            label: DAY_LABELS[d.getDay()],
            date: d.getDate(),
            checked: report.daily_checkin_map[dateStr],
          };
        })
        .reverse()
    : [];

  const checkinPct = report
    ? Math.round((report.checkins_this_week / 7) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-dark-900 border border-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h2 className="font-extrabold text-sm text-white">Weekly Progress Report</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-slate-800/40 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8 space-y-2">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          )}

          {report && (
            <>
              {/* Streak Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Current Streak</span>
                  </div>
                  <div className="text-3xl font-black text-white">{report.current_streak_days}<span className="text-sm font-semibold text-slate-400 ml-1">days</span></div>
                </div>
                <div className="glass-card rounded-2xl p-4 border border-violet-500/20 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Best Streak</span>
                  </div>
                  <div className="text-3xl font-black text-white">{report.longest_streak_days}<span className="text-sm font-semibold text-slate-400 ml-1">days</span></div>
                </div>
              </div>

              {/* This Week Stats */}
              <div className="glass-card rounded-2xl p-4 border border-slate-700/50 space-y-3">
                <h3 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">This Week</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xl font-black text-white">{report.checkins_this_week}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Check-ins</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl font-black ${report.relapses_this_week > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {report.relapses_this_week}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Slips</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-teal-400">{report.tasks_completed_this_week}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Tasks Done</div>
                  </div>
                </div>
              </div>

              {/* Daily Check-in Map */}
              <div className="glass-card rounded-2xl p-4 border border-slate-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <h3 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Daily Check-ins</h3>
                  </div>
                  <span className="text-[10px] font-bold text-white">{report.checkins_this_week}/7 days</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      checkinPct >= 70 ? 'bg-emerald-500' : checkinPct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${checkinPct}%` }}
                  />
                </div>
                {/* Day Dots */}
                <div className="flex justify-between">
                  {weekDays.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                        day.checked
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}>
                        {day.checked ? '✓' : day.date}
                      </div>
                      <span className="text-[8px] text-slate-500">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Trigger */}
              {report.top_trigger_this_week && (
                <div className="glass-card rounded-2xl p-4 border border-orange-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">Top Trigger This Week</span>
                    </div>
                    <span className="text-sm font-black text-white">
                      {TRIGGER_LABELS[report.top_trigger_this_week] ?? report.top_trigger_this_week}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              )}

              {/* All-time Check-ins */}
              <div className="glass-card rounded-2xl p-4 border border-teal-500/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">Total All-time Check-ins</span>
                  </div>
                  <span className="text-2xl font-black text-white">{report.total_checkins}</span>
                </div>
              </div>

              {/* Motivational Message */}
              <div className="glass-card rounded-2xl p-4 border border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Your Message</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic">"{report.motivational_message}"</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
