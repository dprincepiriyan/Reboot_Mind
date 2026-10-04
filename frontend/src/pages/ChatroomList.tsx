import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Sparkles, ChevronRight, ShieldCheck, Loader } from 'lucide-react';
import { chatroomsApi, ChatroomInfo } from '../api/chatrooms';
import { authApi, Profile } from '../api/auth';
import { useSocket } from '../hooks/useSocket';

export const ChatroomList: React.FC = () => {
  const navigate = useNavigate();
  const [chatrooms, setChatrooms] = useState<ChatroomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useSocket({
    onMatched: (chatroomId) => {
      navigate(`/chatroom/${chatroomId}`);
    }
  });

  useEffect(() => {
    Promise.all([chatroomsApi.getUserChatrooms(), authApi.getMe()])
      .then(([rooms, user]) => {
        setChatrooms(rooms);
        setProfile(user);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load chatrooms. Please try again.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 glass-card rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-5 pb-28 font-sans animate-fade-in">
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Peer Circles</h2>
          <p className="text-xs text-slate-400">Anonymous support rooms matched by neuro-recovery stage</p>
        </div>
        <button
          onClick={() => navigate('/questionnaire')}
          className="text-xs text-brand-300 hover:text-brand-200 font-semibold flex items-center gap-1.5 bg-dark-850 hover:bg-dark-800 px-3 py-1.5 rounded-xl border border-brand-500/20 transition-all active:scale-95 shadow-surface-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>New Match</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs font-medium mb-4">
          {error}
        </div>
      )}

      {chatrooms.length === 0 ? (
        profile?.has_completed_questionnaire ? (
          <div className="glass-card rounded-3xl p-8 text-center space-y-4 border border-white/[0.05]">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
              <Loader className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Connecting With Your Circle...</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Matching you anonymously with peers on a similar timeline. This typically takes just a few moments.
              </p>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-8 text-center space-y-4 border border-white/[0.05]">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">No Active Circle Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Take the brief questionnaire to be paired anonymously with peers walking the same path.
              </p>
            </div>
            <button
              onClick={() => navigate('/questionnaire')}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-brand-950/30 transition-all active:scale-98"
            >
              Start Matching Assessment
            </button>
          </div>
        )
      ) : (
        <div className="space-y-2.5">
          {chatrooms.map((room) => (
            <div
              key={room.id}
              onClick={() => navigate(`/chatroom/${room.id}`)}
              className="glass-card rounded-2xl p-4 cursor-pointer flex items-center gap-3.5 group border border-white/[0.05] hover:border-brand-500/30 shadow-surface-sm transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-dark-850 border border-white/[0.06] text-brand-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-surface-sm">
                {room.addiction_type.substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white capitalize">
                    {room.addiction_type} Circle
                  </span>
                  {room.is_general && (
                    <span className="text-[9px] bg-dark-900 border border-white/[0.04] text-slate-400 px-2 py-0.5 rounded-full font-medium">
                      General
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                  <Users className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span className="truncate text-[11px]">
                    {room.members.map((m) => m.display_name).join(', ')}
                  </span>
                </div>

                {room.last_message && (
                  <p className="text-[11px] text-slate-400 truncate mt-1">
                    <strong className="text-slate-300 font-medium">{room.last_message.display_name}:</strong> {room.last_message.content}
                  </p>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors shrink-0" />
            </div>
          ))}
        </div>
      )}

      <div className="p-3.5 rounded-2xl bg-dark-900/60 border border-white/[0.04] flex items-center gap-3 text-xs text-slate-400 shadow-surface-sm">
        <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
        <span className="text-[11px]">Identities are cryptographically decoupled from chat messages for total privacy.</span>
      </div>
    </div>
  );
};
