import React, { useState, useEffect, useRef } from 'react';
import { Waves, Wind, ShieldCheck, AlertTriangle, X, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { BreathingPacer } from './BreathingPacer';
import { haptics } from '../lib/haptics';
import { wakeLock } from '../lib/wakeLock';
import { registerBackHandler } from '../lib/backButton';

interface UrgeSurfingModalProps {
  triggerTag: string;
  note?: string;
  onSurfed: () => void;
  onSlipped: () => void;
  onClose: () => void;
}

const COPING_PROMPTS = [
  { min: 0, title: 'Ground Your Body', text: 'Notice where you feel this urge physically (chest, stomach, jaw?). Breathe into it without fighting.' },
  { min: 2, title: 'Ride the Peak', text: 'An urge is like an ocean wave: it rises, crests, and naturally breaks. You are currently at or near the peak.' },
  { min: 4, title: 'Shock the Senses', text: 'Drink a cold glass of water. Splash your face with cold water or hold an ice cube to stimulate your vagus nerve.' },
  { min: 6, title: 'Reframe the Craving', text: 'This craving is not a command; it is just a temporary neurochemical memory in your brain that is fading.' },
  { min: 8, title: 'The Wave is Receding', text: 'Dopamine urgency drops sharply after 8–10 minutes. Notice your breath and pulse returning to baseline.' },
  { min: 10, title: 'Victory in Sight', text: 'You have actively rewired your brain by waiting out the impulsive reflex. You survived the wave.' },
];

export const UrgeSurfingModal: React.FC<UrgeSurfingModalProps> = ({
  triggerTag,
  note,
  onSurfed,
  onSlipped,
  onClose,
}) => {
  const [totalSeconds, setTotalSeconds] = useState(600); // 10 minutes default
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [isActive, setIsActive] = useState(true);
  const [showBreathing, setShowBreathing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    wakeLock.request();
    const unregister = registerBackHandler(() => {
      onClose();
      return true;
    });
    return () => {
      wakeLock.release();
      unregister();
    };
  }, [onClose]);

  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = (newDurationSeconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTotalSeconds(newDurationSeconds);
    setSecondsLeft(newDurationSeconds);
    setIsActive(true);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const elapsedMinutes = Math.floor((totalSeconds - secondsLeft) / 60);

  // Find the current prompt based on elapsed time
  const currentPrompt = [...COPING_PROMPTS].reverse().find(p => elapsedMinutes >= p.min) || COPING_PROMPTS[0];

  // Calculate progress percentage for wave ring
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-dark-900 border border-white/[0.08] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-surface-lg relative overflow-hidden">
        {/* Subtle Background glow */}
        <div className="absolute -right-12 -top-12 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-dark-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-400">
            <Waves className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Urge Surfing Protocol</h3>
            <p className="text-[11px] text-teal-300/90 font-medium">
              Trigger: <span className="capitalize font-semibold text-white">"{triggerTag}"</span> · Ride out the wave
            </p>
          </div>
        </div>

        {/* Duration Selector Tabs */}
        <div className="flex bg-dark-850 p-1 rounded-xl border border-white/[0.05]">
          <button
            onClick={() => resetTimer(600)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              totalSeconds === 600 ? 'bg-dark-750 text-teal-300 shadow-surface-sm border border-white/[0.06]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            10-Minute Surf
          </button>
          <button
            onClick={() => resetTimer(900)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              totalSeconds === 900 ? 'bg-dark-750 text-teal-300 shadow-surface-sm border border-white/[0.06]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            15-Minute Deep Surf
          </button>
        </div>

        {/* Wave Animation & Timer Ring */}
        <div className="relative flex flex-col items-center justify-center py-2">
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Outer wave ripple */}
            <div className="absolute inset-0 rounded-full border border-teal-500/20 animate-pulse"></div>
            <div className="absolute inset-3 rounded-full bg-dark-850/80 border border-white/[0.06] flex items-center justify-center shadow-inner">
              {/* Inner Content */}
              <div className="flex flex-col items-center justify-center text-center z-10 space-y-0.5">
                <span className="text-3xl font-bold text-white font-mono tracking-tight">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">
                  {secondsLeft === 0 ? 'Wave Surfed!' : isActive ? 'Surfing Wave' : 'Paused'}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {Math.round(progressPercent)}% elapsed
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5 mt-3">
            <button
              onClick={toggleTimer}
              className="p-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 shadow-surface-sm transition-all active:scale-95"
              title={isActive ? 'Pause' : 'Resume'}
            >
              {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button
              onClick={() => resetTimer(totalSeconds)}
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white border border-white/[0.06] transition-all active:scale-95"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rotating Scientific Coping Prompt */}
        <div className="p-3.5 rounded-2xl bg-dark-850/90 border border-white/[0.05] text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-teal-300 text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentPrompt.title}</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {currentPrompt.text}
          </p>
        </div>

        {/* Quick Breathing Pacer Button */}
        <button
          onClick={() => setShowBreathing(true)}
          className="w-full py-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/[0.06] text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-surface-sm"
        >
          <Wind className="w-3.5 h-3.5 text-teal-400" />
          <span>Launch Breathwork Pacer</span>
        </button>

        {/* Resolution Options */}
        <div className="pt-2 border-t border-white/[0.06] space-y-2">
          <button
            onClick={() => {
              haptics.success();
              onSurfed();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-dark-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-950/20 transition-all active:scale-98"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>I Surfed the Wave (Craving Passed) 🌊</span>
          </button>

          <button
            onClick={() => {
              haptics.warning();
              onSlipped();
            }}
            className="w-full py-1.5 rounded-xl text-slate-400 hover:text-amber-300 text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80" />
            <span>I slipped (Log with Self-Compassion)</span>
          </button>
        </div>
      </div>

      {/* Embedded Breathing Pacer Modal */}
      {showBreathing && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-dark-900 border border-slate-700 rounded-3xl max-w-sm w-full p-4 relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Wind className="w-4 h-4 text-teal-400" />
                <span>Urge Wave Breathwork</span>
              </h4>
              <button
                onClick={() => setShowBreathing(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <BreathingPacer onComplete={() => setShowBreathing(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
