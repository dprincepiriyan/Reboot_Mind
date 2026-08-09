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
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">
          {error}
        </div>
      )}

      {/* Daily Progress Header */}
      <div className="glass-card rounded-3xl p-6 border border-emerald-500/30 flex items-center justify-between shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <h2 className="font-extrabold text-lg text-white">Daily Tasks</h2>
          </div>
          <p className="text-xs text-slate-400">
            Small daily habits lead to lasting recovery strength.
          </p>
          <div className="text-xs font-bold text-emerald-400 mt-2">
            {completedCount} of {tasks.length} Completed ({progressPercent}%)
          </div>
        </div>

        {/* Progress Circle */}
        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-emerald-400 transition-all duration-500"
              strokeDasharray={`${progressPercent}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-xs font-extrabold text-white">{progressPercent}%</span>
        </div>
      </div>

      {/* Complete All Banner */}
      {completedCount === tasks.length && tasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border border-emerald-500/40 text-center space-y-1 animate-bounce">
          <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-emerald-300">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>All Daily Tasks Completed!</span>
          </div>
          <p className="text-xs text-slate-300">Awesome job taking control of your daily wellness today.</p>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onComplete={handleComplete} />
        ))}
      </div>
    </div>
  );
};
