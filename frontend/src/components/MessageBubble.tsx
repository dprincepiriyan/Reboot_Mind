import React from 'react';
import { Message } from '../api/chatrooms';

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
  const formattedTime = new Date(message.sent_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex items-end gap-2.5 my-2.5 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${gradient} shadow-md shrink-0`}
        title={message.display_name}
      >
        {message.display_name.substring(0, 2).toUpperCase()}
      </div>

      {/* Bubble Content */}
      <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
        isCurrentUser 
          ? 'bg-brand-600 text-white rounded-br-none' 
          : 'bg-dark-700 text-slate-100 border border-slate-700/50 rounded-bl-none'
      }`}>
        {!isCurrentUser && (
          <div className="text-[11px] font-semibold text-emerald-400 mb-0.5">
            {message.display_name}
          </div>
        )}
        <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed">
          {message.content}
        </p>
        <div className={`text-[10px] mt-1 text-right ${isCurrentUser ? 'text-emerald-100/70' : 'text-slate-400'}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
};
