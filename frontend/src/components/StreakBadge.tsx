import React from 'react';
import { MilestoneBadge } from '../api/sobriety';

interface StreakBadgeProps {
  badge: MilestoneBadge;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ badge }) => {
  return (
    <div className={`flex items-center gap-3.5 p-3.5 rounded-2xl transition-all ${
      badge.earned 
        ? 'glass-card border-emerald-500/30 shadow-lg shadow-emerald-950/20' 
        : 'bg-dark-800/50 border border-slate-800 opacity-60'
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
        badge.earned ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
      }`}>
        {badge.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`font-bold text-sm ${badge.earned ? 'text-white' : 'text-slate-400'}`}>
            {badge.title}
          </h4>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            badge.earned ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
          }`}>
            {badge.days_required} {badge.days_required === 1 ? 'Day' : 'Days'}
          </span>
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">{badge.description}</p>
      </div>
    </div>
  );
};
