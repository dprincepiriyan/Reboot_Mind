import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { DailyTask } from '../api/tasks';

interface TaskCardProps {
  task: DailyTask;
  onComplete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete }) => {
  return (
    <div className={`flex items-start gap-3.5 p-4 rounded-2xl transition-all ${
      task.completed 
        ? 'bg-emerald-950/20 border border-emerald-500/30' 
        : 'glass-card glass-card-hover'
    }`}>
      <button
        disabled={task.completed}
        onClick={() => onComplete(task.id)}
        className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
          task.completed ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'
        }`}
      >
        {task.completed ? (
          <CheckCircle2 className="w-6 h-6 fill-emerald-500/20 text-emerald-400" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>

      <div className="flex-1">
        <p className={`text-sm leading-relaxed ${task.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-100 font-medium'}`}>
          {task.task_text}
        </p>
        {task.addiction_type && (
          <span className="inline-block text-[10px] uppercase font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full mt-2">
            {task.addiction_type}
          </span>
        )}
      </div>
    </div>
  );
};
