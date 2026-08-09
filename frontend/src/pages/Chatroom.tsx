import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, ShieldAlert, HeartHandshake, X, Award } from 'lucide-react';
import { MessageBubble } from '../components/MessageBubble';
import { SOSButton } from '../components/SOSButton';
import { useSocket } from '../hooks/useSocket';
import { authApi, Profile } from '../api/auth';
import { chatroomsApi, ChatroomInfo, GraduationOffer } from '../api/chatrooms';

export const Chatroom: React.FC = () => {
  const { id: chatroomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [chatroomInfo, setChatroomInfo] = useState<ChatroomInfo | null>(null);
  const [inputContent, setInputContent] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [graduationOffer, setGraduationOffer] = useState<GraduationOffer | null>(null);
  const [isOfferLoading, setIsOfferLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    typingUser,
    sosAlert,
    joinRoom,
    sendMessage,
    sendTyping,
    triggerSOSAlert,
  } = useSocket({
    activeChatroomId: chatroomId,
    onGraduationOffer: (data) => {
      if (data.chatroom_id === chatroomId) {
        setGraduationOffer({
          id: data.offer_id,
          chatroom_id: data.chatroom_id,
          milestone_tier: data.milestone_tier,
          status: 'pending'
        });
      }
    },
    onRoomMerged: (data) => {
      if (data.old_room_id === chatroomId) {
        navigate(`/chatrooms/${data.new_room_id}`);
      }
    }
  });

  const [error, setError] = useState<string | null>(null);

  const fetchOffer = () => {
    if (chatroomId) {
      chatroomsApi.getGraduationOffer(chatroomId)
        .then(setGraduationOffer)
        .catch(err => console.error("Failed to load graduation offer:", err));
    }
  };

  useEffect(() => {
    authApi.getMe()
      .then(setCurrentUser)
      .catch((err) => {
        console.error(err);
        setError('Failed to load user profile.');
      });

    if (chatroomId) {
      chatroomsApi.getUserChatrooms()
        .then((rooms) => {
          const found = rooms.find((r) => r.id === chatroomId);
          if (found) {
            setChatroomInfo(found);
            fetchOffer();
          } else {
            setError('Chatroom not found or access denied.');
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load chatroom info.');
        });
    }
  }, [chatroomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatroomId && inputContent.trim()) {
      sendMessage(chatroomId, inputContent);
      setInputContent('');
    }
  };

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);
    if (chatroomId) {
      if (!typingTimeoutRef.current) {
        sendTyping(chatroomId);
        typingTimeoutRef.current = setTimeout(() => {
          typingTimeoutRef.current = null;
        }, 2000);
      }
    }
  };

  const handleAcceptOffer = async () => {
    if (!chatroomId || !graduationOffer) return;
    setIsOfferLoading(true);
    try {
      const res = await chatroomsApi.acceptGraduationOffer(chatroomId);
      navigate(`/chatrooms/${res.new_chatroom_id}`);
    } catch (err) {
      console.error("Failed to accept offer:", err);
      setError("Failed to accept graduation offer. Please try again.");
    } finally {
      setIsOfferLoading(false);
    }
  };

  const handleDeclineOffer = async () => {
    if (!chatroomId || !graduationOffer) return;
    setIsOfferLoading(true);
    try {
      await chatroomsApi.declineGraduationOffer(chatroomId);
      setGraduationOffer(null);
    } catch (err) {
      console.error("Failed to decline offer:", err);
      setError("Failed to dismiss graduation offer.");
    } finally {
      setIsOfferLoading(false);
    }
  };

  if (!chatroomId) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] max-w-md mx-auto bg-dark-900 border-x border-slate-800/50">
      {/* Room Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-800/90 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chatrooms')}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold text-sm text-white capitalize">
              {chatroomInfo ? `${chatroomInfo.addiction_type} Support Circle` : 'Support Chatroom'}
            </h3>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Encrypted Anonymous Room</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SOSButton
            chatroomId={chatroomId}
            onSOSTriggered={(level) => triggerSOSAlert(chatroomId, level)}
          />

          <button
            onClick={() => setShowMembers(!showMembers)}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-dark-700/60 hover:bg-dark-700 transition-colors"
            title="Members"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 p-2.5 text-xs text-red-400 text-center shrink-0">
          {error}
        </div>
      )}

      {/* Graduation Offer Banner */}
      {graduationOffer && (
        <div className="bg-gradient-to-r from-emerald-900/95 to-teal-950/95 border-b border-emerald-500/40 p-4 text-xs text-white flex flex-col gap-2.5 shrink-0 shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"></div>
          <div className="flex items-start gap-2.5 relative">
            <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-emerald-300">Milestone Reached! 🎉</h4>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                Every member in this circle has crossed a <strong>{graduationOffer.milestone_tier === '30_day' ? '30 Days' : graduationOffer.milestone_tier === '90_day' ? '90 Days' : '1 Year'}</strong> sobriety streak! 
                Would you like to merge into a graduated support circle with other groups at the same milestone?
              </p>
            </div>
          </div>
          <div className="flex gap-2 relative mt-1">
            <button
              disabled={isOfferLoading}
              onClick={handleAcceptOffer}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-dark-950 font-extrabold text-[10px] transition-all"
            >
              Accept & Join
            </button>
            <button
              disabled={isOfferLoading}
              onClick={handleDeclineOffer}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold text-[10px] transition-all"
            >
              Not Now
            </button>
          </div>
        </div>
      )}

      {/* SOS Alert Banner */}
      {sosAlert && (
        <div className="bg-gradient-to-r from-red-900/90 to-rose-900/90 border-b border-red-500/40 p-3 text-xs text-white flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-300 shrink-0" />
            <div>
              <strong className="text-red-200">{sosAlert.display_name}</strong> triggered an SOS alert ({sosAlert.level}).
              <div className="text-[10px] text-red-200/80">Offer kind words and supportive check-in below.</div>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembers && chatroomInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card max-w-xs w-full rounded-2xl p-5 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Circle Members ({chatroomInfo.members.length})</span>
              </h4>
              <button onClick={() => setShowMembers(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {chatroomInfo.members.map((m) => (
                <div key={m.profile_id} className="flex items-center gap-3 p-2 rounded-xl bg-dark-800/60">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-xs font-bold text-white">
                    {m.display_name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-200">{m.display_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <HeartHandshake className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-xs">This is the start of your anonymous support room.</p>
            <p className="text-[11px]">Say hello or share how you're feeling today!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUser={currentUser?.display_name === msg.display_name}
            />
          ))
        )}

        {typingUser && (
          <div className="text-[11px] text-slate-400 italic px-2 py-1 animate-pulse">
            {typingUser} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-3 bg-dark-800/90 border-t border-slate-800 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputContent}
          onChange={handleInputChange}
          placeholder="Share encouragement or check in..."
          className="flex-1 bg-dark-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={!inputContent.trim()}
          className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white shadow-md transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
