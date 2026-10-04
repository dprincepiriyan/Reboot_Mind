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
        navigate(`/chatroom/${data.new_room_id}`);
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
      navigate(`/chatroom/${res.new_chatroom_id}`);
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
    <div className="flex flex-col h-[calc(100vh-60px)] max-w-md mx-auto bg-dark-950 border-x border-white/[0.05] font-sans">
      {/* Room Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-900/90 backdrop-blur-md border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chatrooms')}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold text-xs text-white capitalize">
              {chatroomInfo ? `${chatroomInfo.addiction_type} Circle` : 'Support Room'}
            </h3>
            <div className="text-[10px] text-brand-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
              <span>Anonymous Peer Support</span>
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
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/[0.05] transition-colors shadow-surface-sm"
            title="Members"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 p-2.5 text-xs text-rose-300 text-center shrink-0">
          {error}
        </div>
      )}

      {/* Graduation Offer Banner */}
      {graduationOffer && (
        <div className="bg-dark-850 border-b border-brand-500/30 p-4 text-xs text-white flex flex-col gap-2.5 shrink-0 shadow-surface-md relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-start gap-2.5 relative">
            <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-brand-300">Milestone Reached! 🎉</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Every member in this circle has crossed a <strong className="text-white">{graduationOffer.milestone_tier === '30_day' ? '30 Days' : graduationOffer.milestone_tier === '90_day' ? '90 Days' : '1 Year'}</strong> sobriety streak! 
                Would you like to merge into a graduated circle with other groups at the same milestone?
              </p>
            </div>
          </div>
          <div className="flex gap-2 relative mt-1">
            <button
              disabled={isOfferLoading}
              onClick={handleAcceptOffer}
              className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-dark-950 font-bold text-[10px] transition-all active:scale-95 shadow-surface-sm"
            >
              Accept & Join
            </button>
            <button
              disabled={isOfferLoading}
              onClick={handleDeclineOffer}
              className="px-3.5 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-750 disabled:opacity-50 text-slate-300 font-semibold text-[10px] transition-all"
            >
              Not Now
            </button>
          </div>
        </div>
      )}

      {/* SOS Alert Banner */}
      {sosAlert && (
        <div className="bg-rose-500/15 border-b border-rose-500/30 p-3 text-xs text-rose-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <strong className="text-white font-bold">{sosAlert.display_name}</strong> triggered an SOS ({sosAlert.level}).
              <div className="text-[10px] text-rose-300/80">Send kind words and supportive check-in below.</div>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembers && chatroomInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-dark-900 border border-white/[0.08] max-w-xs w-full rounded-3xl p-5 space-y-4 shadow-surface-lg">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                <span>Circle Members ({chatroomInfo.members.length})</span>
              </h4>
              <button 
                onClick={() => setShowMembers(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-dark-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {chatroomInfo.members.map((m) => (
                <div key={m.profile_id} className="flex items-center gap-2.5 p-2 rounded-xl bg-dark-850 border border-white/[0.04]">
                  <div className="w-7 h-7 rounded-lg bg-dark-800 border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-brand-300">
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
          <div className="text-center py-16 text-slate-500 space-y-2.5">
            <HeartHandshake className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-xs font-medium text-slate-400">This is the beginning of your peer support circle.</p>
            <p className="text-[11px] text-slate-500">Say hello or share how your recovery is feeling today.</p>
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
          <div className="text-[10px] text-slate-400 italic px-2 py-1 animate-pulse">
            {typingUser} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-3 bg-dark-900/90 backdrop-blur-md border-t border-white/[0.06] flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputContent}
          onChange={handleInputChange}
          placeholder="Share encouragement or check in..."
          className="flex-1 bg-dark-850 border border-slate-700/70 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/80 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputContent.trim()}
          className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white shadow-md shadow-brand-950/30 transition-all active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
