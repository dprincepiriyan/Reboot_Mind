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
    <div className="max-w-md mx-auto p-4 space-y-5 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Your Support Circles</h2>
          <p className="text-xs text-slate-400">Anonymous support chatrooms matched by algorithm</p>
        </div>
        <button
          onClick={() => navigate('/questionnaire')}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Match</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">
          {error}
        </div>
      )}

      {chatrooms.length === 0 ? (
        profile?.has_completed_questionnaire ? (
          <div className="glass-card rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Loader className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Finding Your Circle...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Our algorithm is matching you with an anonymous peer support group. This usually takes a few moments.
              </p>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Active Circle Yet</h3>
              <p className="text-xs text-slate-400 mt-1">
                Complete the questionnaire to get matched with an anonymous peer support group.
              </p>
            </div>
            <button
              onClick={() => navigate('/questionnaire')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 text-white font-bold text-xs"
            >
              Start Matching Questionnaire
            </button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {chatrooms.map((room) => (
            <div
              key={room.id}
              onClick={() => navigate(`/chatroom/${room.id}`)}
              className="glass-card glass-card-hover rounded-2xl p-4 cursor-pointer flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
                {room.addiction_type.substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white capitalize">
                    {room.addiction_type} Circle
                  </span>
                  {room.is_general && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      General
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                  <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {room.members.map((m) => m.display_name).join(', ')}
                  </span>
                </div>

                {room.last_message && (
                  <p className="text-[11px] text-slate-400 truncate mt-1">
                    <strong className="text-slate-300">{room.last_message.display_name}:</strong> {room.last_message.content}
                  </p>
                )}
              </div>

              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
            </div>
          ))}
        </div>
      )}

      <div className="p-4 rounded-2xl bg-dark-800/60 border border-slate-800/60 flex items-center gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>All conversations are end-to-end isolated by anonymous display names.</span>
      </div>
    </div>
  );
};
