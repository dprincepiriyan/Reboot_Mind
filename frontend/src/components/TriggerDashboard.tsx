import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { sobrietyApi, SobrietyPatterns } from '../api/sobriety';
import { ShieldAlert, Plus, Lightbulb } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PRESET_TRIGGERS = ['stress', 'social', 'boredom', 'late night', 'loneliness', 'habit'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TriggerDashboardProps {
  onCravingLogged: () => void;
}

export const TriggerDashboard: React.FC<TriggerDashboardProps> = ({ onCravingLogged }) => {
  const [patterns, setPatterns] = useState<SobrietyPatterns | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isLogging, setIsLogging] = useState(false);
  const [insight, setInsight] = useState<string>('Log cravings to generate pattern insights.');
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = async () => {
    try {
      const data = await sobrietyApi.getPatterns();
      setPatterns(data);
      generateInsight(data);
    } catch (err) {
      console.error('Failed to fetch pattern aggregates:', err);
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
      setNote('');
      setSelectedTag('');
      await fetchPatterns();
      onCravingLogged();
    } catch (err) {
      console.error('Failed to log craving:', err);
      setError('Failed to log craving event. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

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
    <div className="space-y-6">
      {/* Log a Craving Panel */}
      <div className="glass-card rounded-3xl p-5 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          Track a Craving Trigger
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">
              Identify the Trigger
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TRIGGERS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                    selectedTag === tag
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-950/20'
                      : 'bg-dark-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What led to this craving? (Optional reflection)..."
              className="w-full bg-dark-900/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleLogCraving}
              disabled={isLogging || !selectedTag}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
            >
              <Plus className="w-4 h-4" />
              <span>Log Craving Event</span>
            </button>
          </div>

          {error && <div className="text-[11px] text-red-400 font-semibold">{error}</div>}
        </div>
      </div>

      {/* Insight Section */}
      <div className="glass-card rounded-3xl p-4 bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3 shadow-lg">
        <Lightbulb className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-emerald-300">Trigger Insights</h4>
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
    </div>
  );
};
