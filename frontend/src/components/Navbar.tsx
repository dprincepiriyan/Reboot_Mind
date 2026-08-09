import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Flame, CheckSquare, LogOut, Shield } from 'lucide-react';
import { Profile } from '../api/auth';

interface NavbarProps {
  user: Profile | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-dark-800/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/chatrooms')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white font-black text-sm shadow-md">
              M
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">MAD</span>
              <span className="text-[10px] block font-medium text-slate-400 -mt-1">Anonymous Circle</span>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-dark-700/80 px-2.5 py-1 rounded-full border border-slate-700/50">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">{user.display_name}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-800/90 backdrop-blur-lg border-t border-slate-800 py-2">
          <div className="max-w-md mx-auto flex justify-around items-center px-4">
            <NavLink
              to="/chatrooms"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chatrooms</span>
            </NavLink>

            <NavLink
              to="/sobriety"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Flame className="w-5 h-5" />
              <span>Sobriety</span>
            </NavLink>

            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <CheckSquare className="w-5 h-5" />
              <span>Daily Tasks</span>
            </NavLink>
          </div>
        </nav>
      )}
    </>
  );
};
