import React, { useState, useEffect, useRef } from 'react';
import { Wind, Pause, Play, RotateCcw, Check } from 'lucide-react';
import { haptics } from '../lib/haptics';
import { wakeLock } from '../lib/wakeLock';

interface BreathingPacerProps {
  onComplete?: () => void;
}

type PatternId = 'box' | '4-7-8' | '5-5';
type Phase = 'idle' | 'inhale' | 'holdIn' | 'exhale' | 'holdOut' | 'complete';

interface PatternDef {
  id: PatternId;
  name: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

const PATTERNS: Record<PatternId, PatternDef> = {
  box: { id: 'box', name: 'Box (4-4-4-4)', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  '4-7-8': { id: '4-7-8', name: 'Relax (4-7-8)', inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  '5-5': { id: '5-5', name: 'Calm (5-5)', inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 }
};

export const BreathingPacer: React.FC<BreathingPacerProps> = ({ onComplete }) => {
  const [activePattern, setActivePattern] = useState<PatternId>('box');
  const [phase, setPhase] = useState<Phase>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const maxCycles = 4;
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pattern = PATTERNS[activePattern];

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Phase transition logic
        let nextPhase: Phase = 'idle';
        let nextTime = 0;
        let nextCycle = cycle;
        let isComplete = false;

        switch (phase) {
          case 'inhale':
            if (pattern.holdIn > 0) {
              nextPhase = 'holdIn';
              nextTime = pattern.holdIn;
            } else {
              nextPhase = 'exhale';
              nextTime = pattern.exhale;
            }
            break;
          case 'holdIn':
            nextPhase = 'exhale';
            nextTime = pattern.exhale;
            break;
          case 'exhale':
            if (pattern.holdOut > 0) {
              nextPhase = 'holdOut';
              nextTime = pattern.holdOut;
            } else {
              if (cycle < maxCycles) {
                nextPhase = 'inhale';
                nextTime = pattern.inhale;
                nextCycle = cycle + 1;
              } else {
                isComplete = true;
              }
            }
            break;
          case 'holdOut':
            if (cycle < maxCycles) {
              nextPhase = 'inhale';
              nextTime = pattern.inhale;
              nextCycle = cycle + 1;
            } else {
              isComplete = true;
            }
            break;
        }

        if (isComplete) {
          setIsActive(false);
          setPhase('complete');
          haptics.success();
          if (onComplete) onComplete();
          return 0;
        }

        haptics.breathingPulse();
        setPhase(nextPhase);
        setCycle(nextCycle);
        return nextTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, cycle, pattern, maxCycles, onComplete]);

  // Keep screen awake while breathing session is actively running
  useEffect(() => {
    if (isActive) {
      wakeLock.request();
    } else {
      wakeLock.release();
    }
    return () => {
      wakeLock.release();
    };
  }, [isActive]);

  const toggleTimer = () => {
    if (phase === 'complete') {
      reset();
    }
    
    if (!isActive && (phase === 'idle' || phase === 'complete')) {
      setPhase('inhale');
      setTimeLeft(pattern.inhale);
      setCycle(1);
    }
    setIsActive(!isActive);
  };

  const reset = () => {
    setIsActive(false);
    setPhase('idle');
    setTimeLeft(0);
    setCycle(1);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'holdIn': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'holdOut': return 'Hold';
      case 'complete': return 'Well done';
      default: return 'Ready?';
    }
  };

  const getCircleScale = () => {
    if (phase === 'inhale' || phase === 'holdIn') return 1.5;
    return 1;
  };

  const getTransitionDuration = () => {
    if (phase === 'inhale') return `${pattern.inhale}s`;
    if (phase === 'exhale') return `${pattern.exhale}s`;
    return '0.5s'; // Default smooth transition for other states
  };

  return (
    <div className="w-full max-w-md mx-auto bg-dark-800/80 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 shadow-2xl glass-card flex flex-col items-center">
      {/* Tabs */}
      <div className="flex bg-dark-900/50 p-1 rounded-2xl w-full mb-8">
        {(Object.keys(PATTERNS) as PatternId[]).map((pid) => (
          <button
            key={pid}
            onClick={() => {
              setActivePattern(pid);
              reset();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activePattern === pid
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {PATTERNS[pid].name}
          </button>
        ))}
      </div>

      {/* Cycle Indicator */}
      <div className="text-slate-400 text-xs sm:text-sm font-medium tracking-widest uppercase mb-12">
        {phase === 'complete' ? 'Session Complete' : `Cycle ${cycle} of ${maxCycles}`}
      </div>

      {/* Breathing Circle */}
      <div className="relative flex items-center justify-center w-48 h-48 mb-12">
        {/* Animated Circle */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border-2 border-teal-500/30 flex items-center justify-center transition-transform ease-in-out"
          style={{ 
            transform: `scale(${getCircleScale()})`,
            transitionDuration: getTransitionDuration()
          }}
        >
          {/* Inner Glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-400/10 to-teal-400/10 blur-md"></div>
        </div>
        
        {/* Center Text */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center transition-opacity duration-300">
          {phase === 'complete' ? (
            <Check className="w-12 h-12 text-teal-400 mb-2" />
          ) : phase === 'idle' ? (
            <Wind className="w-12 h-12 text-teal-400/70 mb-2" />
          ) : (
            <div className="text-4xl font-light text-slate-100 mb-1">
              {timeLeft}
            </div>
          )}
          <div className="text-slate-200 text-sm sm:text-base font-medium tracking-wide">
            {getPhaseText()}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={toggleTimer}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-teal-500/25 transition-all active:scale-95"
        >
          {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>
        
        <button
          onClick={reset}
          disabled={phase === 'idle'}
          className={`flex items-center justify-center w-12 h-12 rounded-full bg-dark-900 border border-slate-700 transition-all active:scale-95 ${
            phase === 'idle' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
