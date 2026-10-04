import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { sobrietyApi, SobrietyPatterns } from '../api/sobriety';
import { ifthenApi, IfThenPlan } from '../api/ifthen';
import { UrgeSurfingModal } from './UrgeSurfingModal';
import { ShieldAlert, Plus, Lightbulb, Zap, Edit3, X, Waves } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PRESET_TRIGGERS = ['stress', 'social', 'boredom', 'late night', 'loneliness', 'habit'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TriggerDashboardProps {
  onCravingLogged: () => void;
  onSlipRequested?: () => void;
}

export const TriggerDashboard: React.FC<TriggerDashboardProps> = ({ onCravingLogged, onSlipRequested }) => {
  const [patterns, setPatterns] = useState<SobrietyPatterns | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isLogging, setIsLogging] = useState(false);
  const [insight, setInsight] = useState<string>('Log cravings to generate pattern insights.');
  const [error, setError] = useState<string | null>(null);

  // If-Then Plans State
  const [plans, setPlans] = useState<IfThenPlan[]>([]);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [editingPlanTag, setEditingPlanTag] = useState<string>('');
  const [editingPlanAction, setEditingPlanAction] = useState<string>('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planSuccessMsg, setPlanSuccessMsg] = useState<string | null>(null);

  // Delay Timer / Urge Surfing State
  const [showUrgeModal, setShowUrgeModal] = useState(false);
  const [activeUrgeTag, setActiveUrgeTag] = useState<string>('');
  const [activeUrgeNote, setActiveUrgeNote] = useState<string>('');

  const fetchPatterns = async () => {
    try {
      const data = await sobrietyApi.getPatterns();
      setPatterns(data);
      generateInsight(data);
    } catch (err) {
      console.error('Failed to fetch pattern aggregates:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await ifthenApi.list();
      setPlans(data);
    } catch (err) {
      console.error('Failed to fetch If-Then plans:', err);
    }
  };

  const generateInsight = (data: SobrietyPatterns) => {
    const totalTriggers = Object.values(data.trigger_counts).reduce((a, b) => a + b, 0);
    if (totalTriggers === 0) {
      setInsight('No cravings logged yet. Log a craving trigger below to build your pattern dashboard.');
      return;
    }

    // Find top trigger tag
    let topTag = '';
    let maxTagVal = 0;
    Object.entries(data.trigger_counts).forEach(([tag, count]) => {
      if (count > maxTagVal) {
        maxTagVal = count;
        topTag = tag;
      }
    });

    // Find top day of week
    let topDayIdx = 0;
    let maxDayVal = 0;
    Object.entries(data.day_counts).forEach(([day, count]) => {
      if (count > maxDayVal) {
        maxDayVal = count;
        topDayIdx = parseInt(day);
      }
    });
    const topDay = DAYS_OF_WEEK[topDayIdx];

    // Find top hour bucket
    let topHour = '';
    let maxHourVal = 0;
    Object.entries(data.hour_counts).forEach(([bucket, count]) => {
      if (count > maxHourVal) {
        maxHourVal = count;
        topHour = bucket;
      }
    });

    setInsight(
      `Your main trigger appears to be "${topTag}". Cravings are most frequent on ${topDay}s, typically during the ${topHour}.`
    );
  };

  useEffect(() => {
    fetchPatterns();
    fetchPlans();
  }, []);

  const handleLogCraving = async () => {
    if (!selectedTag) {
      setError('Please select a trigger tag.');
      return;
    }
    setIsLogging(true);
    setError(null);
    try {
      await sobrietyApi.logCraving(selectedTag, note || undefined);
      setActiveUrgeTag(selectedTag);
      setActiveUrgeNote(note);
      setShowUrgeModal(true); // Launch 10-15m Delay Timer / Urge Surfing Protocol!
      await fetchPatterns();
      onCravingLogged();
    } catch (err) {
      console.error('Failed to log craving:', err);
      setError('Failed to log craving event. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlanTag.trim() || !editingPlanAction.trim()) return;
    setIsSavingPlan(true);
    try {
      await ifthenApi.upsert(editingPlanTag.trim(), editingPlanAction.trim());
      await fetchPlans();
      setPlanSuccessMsg('Implementation plan saved!');
      setTimeout(() => setPlanSuccessMsg(null), 2500);
      setEditingPlanTag('');
      setEditingPlanAction('');
    } catch (err) {
      console.error('Failed to save If-Then plan:', err);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await ifthenApi.delete(id);
      await fetchPlans();
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  const activePlan = plans.find(
    (p) => p.trigger_tag.toLowerCase() === selectedTag.toLowerCase()
  );

  const hasData = patterns && Object.keys(patterns.trigger_counts).length > 0;

  const triggerChartData = {
    labels: patterns ? Object.keys(patterns.trigger_counts) : [],
    datasets: [
      {
        label: 'Cravings Count',
        data: patterns ? Object.values(patterns.trigger_counts) : [],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const dayChartData = {
    labels: DAYS_OF_WEEK,
    datasets: [
      {
        label: 'Cravings by Day',
        data: patterns ? DAYS_OF_WEEK.map((_, i) => patterns.day_counts[i] || 0) : [],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const hourChartData = {
    labels: ['Morning', 'Afternoon', 'Evening', 'Night'],
    datasets: [
      {
        label: 'Cravings by Time',
        data: patterns
          ? [
              patterns.hour_counts.morning || 0,
              patterns.hour_counts.afternoon || 0,
              patterns.hour_counts.evening || 0,
              patterns.hour_counts.night || 0,
            ]
          : [],
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: '#94a3b8',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
      },
      x: {
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Log a Craving Panel */}
      <div className="glass-card rounded-3xl p-5 border border-white/[0.06] shadow-surface-md">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Log Craving Trigger
            </h3>
          </div>
          <button
            onClick={() => {
              setEditingPlanTag(selectedTag || 'stress');
              setEditingPlanAction('');
              setShowPlansModal(true);
            }}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>If-Then Protocols ({plans.length})</span>
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 block">
              Select Current Trigger
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TRIGGERS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 active:scale-95 ${
                    selectedTag === tag
                      ? 'bg-brand-500/20 border-brand-400/80 text-brand-300 font-semibold shadow-surface-sm'
                      : 'bg-dark-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Resurfaced "If-Then" Implementation Plan Card */}
          {activePlan ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/[0.07] border border-amber-500/30 space-y-1.5 animate-fade-in shadow-surface-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Pre-Committed Protocol
                </span>
                <button
                  onClick={() => {
                    setEditingPlanTag(activePlan.trigger_tag);
                    setEditingPlanAction(activePlan.coping_action);
                    setShowPlansModal(true);
                  }}
                  className="text-[10px] text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                "If I feel <strong className="text-amber-300 capitalize">{activePlan.trigger_tag}</strong>, I will <span className="text-white font-semibold">{activePlan.coping_action}</span>."
              </p>
            </div>
          ) : selectedTag ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-dark-900/50 border border-white/[0.04] text-xs text-slate-400">
              <span className="text-[11px]">No pre-written plan for "{selectedTag}".</span>
              <button
                onClick={() => {
                  setEditingPlanTag(selectedTag);
                  setEditingPlanAction('');
                  setShowPlansModal(true);
                }}
                className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Plan</span>
              </button>
            </div>
          ) : null}

          <div className="space-y-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What led to this craving? (Optional reflection)..."
              className="w-full bg-dark-900/80 border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/80 transition-colors"
            />
            <button
              onClick={handleLogCraving}
              disabled={isLogging || !selectedTag}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-40 text-dark-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-950/20 transition-all active:scale-98"
            >
              <Waves className="w-4 h-4 text-dark-950" />
              <span>Log Craving & Launch 10-Min Wave Surf</span>
            </button>
          </div>

          {error && <div className="text-[11px] text-rose-400 font-semibold">{error}</div>}
        </div>
      </div>

      {/* Insight Section */}
      <div className="glass-card rounded-2xl p-4 border border-brand-500/20 flex items-start gap-3 shadow-surface-sm">
        <div className="w-7 h-7 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400 shrink-0 mt-0.5">
          <Lightbulb className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider">Pattern Insights</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{insight}</p>
        </div>
      </div>

      {/* Chart Dashboards */}
      {hasData && (
        <div className="space-y-5">
          <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white">Top Cravings by Tag</h4>
            <div className="h-44 relative">
              <Bar data={triggerChartData} options={chartOptions} />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white">Day of the Week Patterns</h4>
            <div className="h-44 relative">
              <Bar data={dayChartData} options={chartOptions} />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white">Time of Day Distribution</h4>
            <div className="h-44 relative">
              <Bar data={hourChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Urge Surfing Modal (Delay Timer) */}
      {showUrgeModal && (
        <UrgeSurfingModal
          triggerTag={activeUrgeTag}
          note={activeUrgeNote}
          onSurfed={() => {
            setShowUrgeModal(false);
            setNote('');
            setSelectedTag('');
          }}
          onSlipped={() => {
            setShowUrgeModal(false);
            setNote('');
            setSelectedTag('');
            if (onSlipRequested) {
              onSlipRequested();
            }
          }}
          onClose={() => {
            setShowUrgeModal(false);
            setNote('');
            setSelectedTag('');
          }}
        />
      )}

      {/* Manage If-Then Implementation Plans Modal */}
      {showPlansModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-dark-900 border border-white/[0.08] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-surface-lg relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowPlansModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-dark-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">"If-Then" Action Protocols</h3>
                <p className="text-[11px] text-slate-400">Pre-commit your somatic responses before cravings hit</p>
              </div>
            </div>

            {planSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-brand-500/15 border border-brand-500/25 text-xs text-brand-300 text-center font-semibold">
                {planSuccessMsg}
              </div>
            )}

            {/* Create/Edit Form */}
            <form onSubmit={handleSavePlan} className="space-y-3 p-3.5 rounded-2xl bg-dark-850/80 border border-white/[0.05]">
              <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>{editingPlanTag ? `Protocol for "${editingPlanTag}"` : 'New Protocol'}</span>
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Trigger Cue</label>
                <input
                  type="text"
                  placeholder="e.g. stress, social, late night, boredom"
                  value={editingPlanTag}
                  onChange={(e) => setEditingPlanTag(e.target.value)}
                  className="w-full bg-dark-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">I will immediately...</label>
                <textarea
                  placeholder="e.g. Do 5 physiological sighs, drink a tall glass of ice water, and message my support circle."
                  value={editingPlanAction}
                  onChange={(e) => setEditingPlanAction(e.target.value)}
                  rows={2}
                  className="w-full bg-dark-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/80 resize-none transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPlan}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 font-bold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isSavingPlan ? 'Saving...' : 'Save If-Then Protocol'}
              </button>
            </form>

            {/* List of Saved Plans */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Saved Protocols ({plans.length})</h4>
              {plans.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-4 italic">
                  No implementation plans pre-written yet. Add one above!
                </p>
              ) : (
                <div className="space-y-1.5">
                  {plans.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-dark-850/60 border border-white/[0.04] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 capitalize text-xs">
                          If I feel {p.trigger_tag}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingPlanTag(p.trigger_tag);
                              setEditingPlanAction(p.coping_action);
                            }}
                            className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded-lg bg-dark-750 border border-white/[0.06] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlan(p.id)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        I will: <span className="font-medium text-white">{p.coping_action}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
