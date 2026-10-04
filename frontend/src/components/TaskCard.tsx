import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { DailyTask } from '../api/tasks';

interface TaskCardProps {
  task: DailyTask;
  onComplete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete }) => {
  return (
    <div className={`flex items-start gap-3.5 p-3.5 rounded-2xl transition-all duration-200 ${
      task.completed 
        ? 'bg-dark-900/40 border border-brand-500/20 opacity-80' 
        : 'glass-card border border-white/[0.05] hover:border-brand-500/30 shadow-surface-sm'
    }`}>
      <button
        disabled={task.completed}
        onClick={() => onComplete(task.id)}
        className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
          task.completed ? 'text-brand-400 cursor-default' : 'text-slate-500 hover:text-brand-400'
        }`}
        aria-label={task.completed ? "Task completed" : "Complete task"}
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 fill-brand-500/15 text-brand-400" />
        ) : (
          <Circle className="w-5 h-5 stroke-[1.75]" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-relaxed transition-all ${
          task.completed 
            ? 'line-through text-slate-500 font-normal' 
            : 'text-slate-200 font-medium'
        }`}>
          {task.task_text}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {task.difficulty_tier && (
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
              task.difficulty_tier === 'mastery'
                ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                : task.difficulty_tier === 'growth'
                ? 'bg-teal-500/10 border-teal-500/20 text-teal-300'
                : 'bg-brand-500/10 border-brand-500/20 text-brand-300'
            }`}>
              {task.difficulty_tier === 'mastery' ? '🌳 Mastery' : task.difficulty_tier === 'growth' ? '🌿 Growth' : '🌱 Foundational'}
            </span>
          )}
          {task.addiction_type && (
            <span className="inline-block text-[9px] uppercase font-semibold text-slate-400 bg-dark-900 border border-white/[0.04] px-2 py-0.5 rounded-md">
              {task.addiction_type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
