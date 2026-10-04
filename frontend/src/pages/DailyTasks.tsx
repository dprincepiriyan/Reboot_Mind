import React, { useEffect, useState } from 'react';
import { CheckSquare, Sparkles, Trophy } from 'lucide-react';
import { tasksApi, DailyTask } from '../api/tasks';
import { TaskCard } from '../components/TaskCard';

export const DailyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const data = await tasksApi.getDailyTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch daily tasks:', err);
      setError('Failed to fetch daily tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleComplete = async (taskId: string) => {
    try {
      await tasksApi.completeTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
      );
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="h-32 glass-card rounded-3xl animate-pulse"></div>
        <div className="h-64 glass-card rounded-3xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-5 pb-28 font-sans animate-fade-in">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs mb-3 font-medium">
          {error}
        </div>
      )}

      {/* Daily Progress Header */}
      <div className="glass-card rounded-3xl p-5 border border-brand-500/20 flex items-center justify-between shadow-surface-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-bold text-base text-white">Daily Habit Tasks</h2>
          </div>
          <p className="text-xs text-slate-400">
            Micro-commitments that compound into neurochemical recovery
          </p>
          <div className="text-xs font-semibold text-brand-300 mt-2">
            {completedCount} of {tasks.length} Completed ({progressPercent}%)
          </div>
        </div>

        {/* Circular Progress Gauge */}
        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-dark-900"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-brand-400 transition-all duration-700 ease-out"
              strokeDasharray={`${progressPercent}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-xs font-bold text-white">{progressPercent}%</span>
        </div>
      </div>

      {/* Complete All Banner */}
      {completedCount === tasks.length && tasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/25 text-center space-y-1 animate-fade-in shadow-surface-sm">
          <div className="flex items-center justify-center gap-1.5 font-bold text-xs text-brand-300 uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>All Daily Habits Completed</span>
          </div>
          <p className="text-xs text-slate-300">You protected your recovery baseline with intention today.</p>
        </div>
      )}

      {/* Adaptive Stage Banner */}
      {tasks[0]?.streak_stage && (
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-dark-900/60 border border-white/[0.04] shadow-surface-sm">
          <span className="font-bold text-xs text-slate-200">
            {tasks[0].streak_stage}
          </span>
          <span className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider">
            Adaptive Difficulty
          </span>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onComplete={handleComplete} />
        ))}
      </div>
    </div>
  );
};
