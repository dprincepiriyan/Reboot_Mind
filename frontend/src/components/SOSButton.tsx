import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, HeartHandshake, X, PhoneCall } from 'lucide-react';
import { sosApi, CrisisResource } from '../api/sos';

interface SOSButtonProps {
  chatroomId: string;
  onSOSTriggered?: (level: string) => void;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ chatroomId, onSOSTriggered }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [resources, setResources] = useState<CrisisResource[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrigger = async (level: 'struggling' | 'urgent') => {
    setIsLoading(true);
    try {
      const res = await sosApi.trigger(chatroomId, level);
      if (onSOSTriggered) {
        onSOSTriggered(level);
      }
      if (level === 'urgent' && res.resources) {
        setResources(res.resources);
      } else {
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Failed to trigger SOS:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Pulse red SOS button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-900/40 transition-all transform hover:scale-105 active:scale-95"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <ShieldAlert className="w-4 h-4" />
        <span>SOS HELP</span>
      </button>

      {/* SOS Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 border border-red-500/30 shadow-2xl relative">
            <button
              onClick={() => { setIsOpen(false); setResources(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!resources ? (
              <div className="text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-500">
                  <ShieldAlert className="w-8 h-8 animate-pulse" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">Do you need immediate support?</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Your safety and well-being are top priority. Choose an option below.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <button
                    disabled={isLoading}
                    onClick={() => handleTrigger('struggling')}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 transition-all text-left group"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">I'm Struggling</div>
                      <div className="text-[11px] text-slate-300">Quietly alert your support group in the chatroom</div>
                    </div>
                  </button>

                  <button
                    disabled={isLoading}
                    onClick={() => handleTrigger('urgent')}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-100 transition-all text-left group"
                  >
                    <div className="p-2 rounded-lg bg-red-600 text-white group-hover:scale-110 transition-transform">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-red-400">I Need Help Now</div>
                      <div className="text-[11px] text-slate-300">Alert group & get 24/7 crisis lines & resources immediately</div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-bold border-b border-red-500/20 pb-3">
                  <HeartHandshake className="w-6 h-6" />
                  <span>Free 24/7 Crisis Helpline Resources</span>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {resources.map((res, i) => (
                    <div key={i} className="p-3 rounded-xl bg-dark-800 border border-slate-700/60 space-y-1">
                      <div className="font-semibold text-sm text-emerald-400">{res.name}</div>
                      <div className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded inline-block">
                        {res.contact}
                      </div>
                      <p className="text-[11px] text-slate-400">{res.description}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setIsOpen(false); setResources(null); }}
                  className="w-full py-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-200 font-medium text-xs transition-colors"
                >
                  Return to Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
