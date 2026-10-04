import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Flame, CheckSquare, LogOut, Shield, BookOpen, Brain, Sparkles, Server } from 'lucide-react';
import { Profile } from '../api/auth';
import { MilestoneVaultModal, AURA_STYLES } from './MilestoneVaultModal';

interface NavbarProps {
  user: Profile | null;
  onLogout: () => void;
  onProfileUpdate?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onProfileUpdate }) => {
  const navigate = useNavigate();
  const [showVault, setShowVault] = useState(false);

  const auraStyle = AURA_STYLES[user?.equipped_aura || 'default'] || AURA_STYLES['default'];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/chatrooms')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-brand-500 to-emerald-700 flex items-center justify-center text-white font-black text-xs shadow-sm shadow-emerald-950/60 ring-1 ring-emerald-400/30">
              R
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-sm tracking-tight text-white block">RebootMind</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide block -mt-0.5">Peer Circle</span>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVault(true)}
                className={`btn-tactile flex items-center gap-2 bg-dark-850/90 hover:bg-dark-800 px-2.5 py-1 rounded-full border transition-all ${auraStyle.ring} shadow-surface-sm`}
                title="Milestone Appearance Vault"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-200">{user.display_name}</span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-dark-950/80 border border-slate-700/50 ${auraStyle.textColor}`}>
                  {user.equipped_title || 'The Seeker'}
                </span>
              </button>
              <button
                id="navbar-server-settings"
                onClick={() => navigate('/connect')}
                className="p-1.5 text-slate-400 hover:text-brand-400 transition-colors rounded-xl hover:bg-slate-800/60"
                title="Server connection"
              >
                <Server className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-xl hover:bg-slate-800/60"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Milestone Dressing Room Modal */}
      {showVault && (
        <MilestoneVaultModal
          onClose={() => setShowVault(false)}
          onEquipped={(aura, title) => {
            if (user) {
              user.equipped_aura = aura;
              user.equipped_title = title;
            }
            if (onProfileUpdate) onProfileUpdate();
          }}
        />
      )}

      {/* Floating Bottom Navigation Dock */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 pb-2.5 pt-1 px-3 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto bg-dark-900/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-1 shadow-surface-lg flex justify-between items-center">
            <NavLink
              to="/chatrooms"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1.5 rounded-xl transition-all btn-tactile ${
                  isActive
                    ? 'bg-dark-800/90 text-emerald-300 shadow-surface-sm border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`
              }
            >
              <MessageSquare className="w-4 h-4" />
              <span>Circle</span>
            </NavLink>

            <NavLink
              to="/sobriety"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1.5 rounded-xl transition-all btn-tactile ${
                  isActive
                    ? 'bg-dark-800/90 text-emerald-300 shadow-surface-sm border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`
              }
            >
              <Flame className="w-4 h-4" />
              <span>Streak</span>
            </NavLink>

            <NavLink
              to="/journal"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1.5 rounded-xl transition-all btn-tactile ${
                  isActive
                    ? 'bg-dark-800/90 text-indigo-300 shadow-surface-sm border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`
              }
            >
              <BookOpen className="w-4 h-4" />
              <span>Journal</span>
            </NavLink>

            <NavLink
              to="/neuro-reset"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1.5 rounded-xl transition-all btn-tactile ${
                  isActive
                    ? 'bg-dark-800/90 text-teal-300 shadow-surface-sm border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`
              }
            >
              <Brain className="w-4 h-4" />
              <span>Wellness</span>
            </NavLink>

            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1.5 rounded-xl transition-all btn-tactile ${
                  isActive
                    ? 'bg-dark-800/90 text-emerald-300 shadow-surface-sm border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`
              }
            >
              <CheckSquare className="w-4 h-4" />
              <span>Habits</span>
            </NavLink>
          </div>
        </nav>
      )}
    </>
  );
};
