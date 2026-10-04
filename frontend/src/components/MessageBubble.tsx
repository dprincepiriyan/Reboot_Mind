import React from 'react';
import { Message } from '../api/chatrooms';
import { AURA_STYLES } from './MilestoneVaultModal';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

// Generate color from avatar_seed
function seedToColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'from-emerald-500 to-teal-700',
    'from-indigo-500 to-purple-700',
    'from-cyan-500 to-blue-700',
    'from-amber-500 to-orange-700',
    'from-pink-500 to-rose-700'
  ];
  return colors[Math.abs(hash) % colors.length];
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isCurrentUser }) => {
  const gradient = seedToColor(message.avatar_seed);
  const auraStyle = AURA_STYLES[message.equipped_aura || 'default'] || AURA_STYLES['default'];
  const formattedTime = new Date(message.sent_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex items-end gap-2.5 my-2.5 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar with Cosmic Aura Ring */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${gradient} shadow-md shrink-0 transition-all ${auraStyle.ring}`}
        title={`${message.display_name} · ${message.equipped_title || 'The Seeker'}`}
      >
        {message.display_name.substring(0, 2).toUpperCase()}
      </div>

      {/* Bubble Content */}
      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-surface-sm text-xs ${
        isCurrentUser 
          ? 'bg-gradient-to-br from-brand-600 to-teal-600 text-white rounded-br-sm' 
          : 'bg-dark-850 text-slate-100 border border-white/[0.05] rounded-bl-sm'
      }`}>
        {!isCurrentUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-semibold text-brand-300">
              {message.display_name}
            </span>
            {message.equipped_title && (
              <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-white/[0.06] ${auraStyle.textColor} bg-dark-900/80`}>
                {message.equipped_title}
              </span>
            )}
          </div>
        )}
        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
          {message.content}
        </p>
        <div className={`text-[9px] mt-1 text-right font-mono ${isCurrentUser ? 'text-emerald-100/70' : 'text-slate-500'}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
};
