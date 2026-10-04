import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Zap,
  Heart,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus,
  ArrowRight,
  Waves
} from 'lucide-react';
import { BreathingPacer } from '../components/BreathingPacer';
import { VideoSection } from '../components/VideoSection';
import { UrgeSurfingModal } from '../components/UrgeSurfingModal';
import { storage, StorageKeys } from '../lib/storage';

interface PleasureLog {
  id: string;
  text: string;
  date: string;
}

export const NeuroReset: React.FC = () => {
  const [scienceExpanded, setScienceExpanded] = useState(false);
  const [activePathway, setActivePathway] = useState<'dopamine' | 'pain' | null>(null);
  const [breathingModalOpen, setBreathingModalOpen] = useState(false);
  const [activeBreathingPattern, setActiveBreathingPattern] = useState<'sigh' | 'box' | null>(null);
  const [urgeModalOpen, setUrgeModalOpen] = useState(false);
  const [emotionSelected, setEmotionSelected] = useState<string | null>(null);

  const [pleasureLogs, setPleasureLogs] = useState<PleasureLog[]>([]);
  const [newLog, setNewLog] = useState('');

  useEffect(() => {
    const saved = storage.get(StorageKeys.pleasureLogs);
    if (saved) {
      try {
        setPleasureLogs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse pleasure logs', e);
      }
    }
  }, []);

  const saveLog = () => {
    if (!newLog.trim()) return;
    const log: PleasureLog = {
      id: Date.now().toString(),
      text: newLog.trim(),
      date: new Date().toISOString(),
    };
    const updated = [log, ...pleasureLogs];
    setPleasureLogs(updated);
    storage.set(StorageKeys.pleasureLogs, JSON.stringify(updated));
    setNewLog('');
  };

  const handleOpenBreathing = (pattern: 'sigh' | 'box') => {
    setActiveBreathingPattern(pattern);
    setBreathingModalOpen(true);
  };

  const togglePathway = (pathway: 'dopamine' | 'pain') => {
    setActivePathway(prev => prev === pathway ? null : pathway);
  };

  const emotions = [
    { name: 'Grief', tip: 'Allow yourself to feel the loss. Journaling helps.' },
    { name: 'Anger', tip: 'Channel the energy into a brisk walk or workout.' },
    { name: 'Loneliness', tip: 'Reach out to one person today, even just a text.' },
    { name: 'Exhaustion', tip: 'Permit yourself to rest without guilt.' },
    { name: 'Shame', tip: 'Talk to yourself as you would a struggling friend.' },
    { name: 'Anxiety', tip: 'Focus on 5 things you can see right now.' },
  ];

  return (
    <div className="bg-dark-950 min-h-screen text-slate-100 pb-28 font-sans animate-fade-in">
      <div className="max-w-md mx-auto p-4 space-y-5">
        
        {/* Header */}
        <header className="flex items-center space-x-3 pt-2">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-surface-sm">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-400">Neuroscience Hub</div>
            <h1 className="text-xl font-bold tracking-tight text-white">Mind & Body Reset</h1>
            <p className="text-xs text-slate-400">Rewire pleasure circuits · Ease emotional pain</p>
          </div>
        </header>

        {/* Science Card */}
        <section className="glass-card rounded-2xl p-4 transition-all duration-200">
          <div 
            className="flex justify-between items-center cursor-pointer select-none" 
            onClick={() => setScienceExpanded(!scienceExpanded)}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Why Addiction Hijacks Your Brain
              </h2>
            </div>
            {scienceExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 transition-transform" />
            )}
          </div>
          
          <div className="mt-3.5 space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-dark-900/50 border border-white/[0.04]">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/20 shrink-0 mt-0.5">
                Spike
              </span>
              <p className="leading-relaxed">
                <strong className="text-slate-100 font-semibold">The Pleasure Trap:</strong> Artificial dopamine surges (substances, screens) cause a deficit crash below baseline, trapping you in cravings just to feel normal.
              </p>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-dark-900/50 border border-white/[0.04]">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shrink-0 mt-0.5">
                Escape
              </span>
              <p className="leading-relaxed">
                <strong className="text-slate-100 font-semibold">The Pain Escape:</strong> When distress hits, the brain seeks instant numbness — but numbing avoids processing and prevents neural healing.
              </p>
            </div>
          </div>

          {scienceExpanded && (
            <div className="mt-3.5 p-3 bg-dark-900/80 rounded-xl text-xs text-slate-300 border border-slate-800 leading-relaxed animate-fade-in space-y-2">
              <div className="font-semibold text-brand-300 flex items-center gap-1.5 text-[11px]">
                <span>Stanford Research Insight</span>
              </div>
              <p className="text-slate-400">
                Research by Dr. Anna Lembke (Stanford Addiction Medicine) proves that after 14–30 days without super-stimuli, your dopamine receptors upregulate and everyday pleasures naturally feel rewarding again.
              </p>
            </div>
          )}
        </section>

        {/* Urgent / Immediate Craving Defuse Card: Urge Surfing Wave */}
        <section className="glass-card rounded-2xl p-4.5 border border-teal-500/20 relative overflow-hidden group shadow-surface-md">
          <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-start justify-between gap-3 relative">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Waves className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">Urge Surfing Protocol</h3>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/25">
                      10–15 Min Wave
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-300/80 font-medium">Ride out acute cravings before reacting</p>
                </div>
              </div>

              <p className="text-xs text-slate-300/90 leading-relaxed pt-1">
                Neurochemically, cravings crest and subside within 10 to 15 minutes. Use the guided wave countdown with rotating somatic prompts and breathwork to surf through.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between gap-3 relative">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block"></span>
              Real-time somatic wave & audio-visual pacing
            </span>
            <button
              onClick={() => setUrgeModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-dark-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-950/30 transition-all active:scale-95 shrink-0"
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Launch Wave 🌊</span>
            </button>
          </div>
        </section>

        {/* Pathway 1: Dopamine */}
        <section className={`glass-card rounded-2xl border ${activePathway === 'dopamine' ? 'border-amber-500/40 shadow-surface-md' : 'border-amber-500/20'} p-4 transition-all duration-200`}>
          <div 
            className="flex justify-between items-center cursor-pointer select-none" 
            onClick={() => togglePathway('dopamine')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Boost Clean Dopamine</h3>
                <p className="text-[11px] text-slate-400">Effort-gated activities that elevate baseline without crashing</p>
              </div>
            </div>
            {activePathway === 'dopamine' ? (
              <ChevronUp className="w-4 h-4 text-amber-400/80 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-amber-400/80 transition-transform" />
            )}
          </div>

          {activePathway === 'dopamine' && (
            <div className="mt-4 space-y-2.5 animate-fade-in">
              <div className="bg-dark-900/60 border border-white/[0.04] p-3 rounded-xl hover:border-amber-500/30 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-xs text-amber-200">Cold Water Splash</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-dark-800 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md">⚡ Instant</span>
                </div>
                <p className="text-xs text-slate-300/90 leading-relaxed">Splash cold water on your face or take a 30-second cold shower. Stanford data shows up to 250% sustained baseline elevation without a sudden crash.</p>
              </div>

              <div className="bg-dark-900/60 border border-white/[0.04] p-3 rounded-xl hover:border-amber-500/30 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-xs text-amber-200">10-Min Movement Burst</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-dark-800 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md">🏃 10 min</span>
                </div>
                <p className="text-xs text-slate-300/90 leading-relaxed">Sprint, dance, push-ups, or brisk walking. Rapid heart rate elevation triggers immediate endorphin release and BDNF expression.</p>
              </div>

              <div className="bg-dark-900/60 border border-white/[0.04] p-3 rounded-xl hover:border-amber-500/30 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-xs text-amber-200">Creative Flow</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-dark-800 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md">🎨 30 min</span>
                </div>
                <p className="text-xs text-slate-300/90 leading-relaxed">Sketch, cook a fresh meal, craft, or build with your hands. Effort-gated dopamine creates deep emotional fulfillment.</p>
              </div>

              <div className="bg-dark-900/60 border border-white/[0.04] p-3 rounded-xl hover:border-amber-500/30 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-xs text-amber-200">Music with Frisson</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-dark-800 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md">🎵 5 min</span>
                </div>
                <p className="text-xs text-slate-300/90 leading-relaxed">Listen deeply to music that produces chills. Acoustic frisson triggers natural striatal dopamine releases safely.</p>
              </div>

              <div className="bg-dark-900/60 border border-white/[0.04] p-3 rounded-xl hover:border-amber-500/30 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-xs text-amber-200">Sunlight & Fresh Air</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-dark-800 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-md">☀️ 15 min</span>
                </div>
                <p className="text-xs text-slate-300/90 leading-relaxed">15 minutes of outdoor daylight exposure resets circadian rhythm and upregulates D2/D3 dopamine receptor density.</p>
              </div>
            </div>
          )}
        </section>

        {/* Pathway 2: Pain */}
        <section className={`glass-card rounded-2xl border ${activePathway === 'pain' ? 'border-indigo-500/40 shadow-surface-md' : 'border-indigo-500/20'} p-4 transition-all duration-200`}>
          <div 
            className="flex justify-between items-center cursor-pointer select-none" 
            onClick={() => togglePathway('pain')}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">Soothe Emotional Pain</h3>
                <p className="text-[11px] text-slate-400">Somatic exercises to calm nervous system dysregulation</p>
              </div>
            </div>
            {activePathway === 'pain' ? (
              <ChevronUp className="w-4 h-4 text-indigo-400/80 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-indigo-400/80 transition-transform" />
            )}
          </div>

          {activePathway === 'pain' && (
            <div className="mt-4 space-y-2.5 animate-fade-in">
              <div className="bg-dark-900/60 border border-white/[0.04] p-3 rounded-xl">
                <div className="flex justify-between items-center mb-1.5">
                  <h4 className="font-semibold text-xs text-indigo-200">Physiological Sigh</h4>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenBreathing('sigh'); }}
                    className="text-[11px] font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 px-3 py-1 rounded-xl transition-all border border-indigo-500/25 active:scale-95"
                  >
                    Start Pacer
                  </button>
                </div>
                <p className="text-xs text-slate-300/90 leading-relaxed">Two quick inhales through the nose, followed by one long, slow exhale through the mouth. The quickest evidence-backed way to deflate autonomic arousal.</p>
              </div>

              <div className="bg-dark-900/60 border border-teal-500/20 p-3 rounded-xl">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-teal-400" />
                    <h4 className="font-semibold text-xs text-teal-200">Urge Surfing Wave Protocol</h4>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setUrgeModalOpen(true); }}
                    className="text-[11px] font-bold bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 px-3 py-1 rounded-xl transition-all border border-teal-500/25 active:scale-95"
                  >
                    Ride Wave
                  </button>
                </div>
                <p className="text-xs text-slate-300/90 leading-relaxed">A 10–15 minute guided countdown. Ride the wave crest with rotating prompts and breathwork until the urge dissolves.</p>
              </div>

              <div className="bg-dark-900/60 border border-white/[0.04] p-3 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-xs text-indigo-200">Legs-Up-The-Wall (Viparita Karani)</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-dark-800 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md">🧘 5 min</span>
                </div>
                <p className="text-xs text-slate-300/90 leading-relaxed">Lie on your back with legs extended up against a wall. Slows heart rate, facilitates venous drainage, and stimulates parasympathetic tone.</p>
              </div>

              <div className="bg-dark-900/60 border border-white/[0.04] p-3.5 rounded-xl">
                <h4 className="font-semibold text-xs text-indigo-200 mb-1">Name It to Tame It</h4>
                <p className="text-xs text-slate-300/90 mb-3 leading-relaxed">Identify underlying distress: Naming an emotion dampens amygdala reactivity by up to 30% (UCLA Affect Labeling Study).</p>
                <div className="flex flex-wrap gap-1.5">
                  {emotions.map(emo => (
                    <button 
                      key={emo.name}
                      onClick={(e) => { e.stopPropagation(); setEmotionSelected(emotionSelected === emo.name ? null : emo.name); }}
                      className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                        emotionSelected === emo.name 
                          ? 'bg-indigo-500/25 border-indigo-400/60 text-indigo-100 font-semibold shadow-sm' 
                          : 'bg-dark-850/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {emo.name}
                    </button>
                  ))}
                </div>
                {emotionSelected && (
                  <div className="mt-3 p-2.5 bg-indigo-950/40 rounded-xl text-xs text-indigo-200 animate-fade-in border border-indigo-500/25">
                    {emotions.find(e => e.name === emotionSelected)?.tip}
                  </div>
                )}
              </div>

              <div className="bg-dark-900/60 border border-white/[0.04] p-3 rounded-xl">
                <div className="flex justify-between items-center mb-1.5">
                  <h4 className="font-semibold text-xs text-indigo-200">Box Breathing (4-4-4-4)</h4>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenBreathing('box'); }}
                    className="text-[11px] font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 px-3 py-1 rounded-xl transition-all border border-indigo-500/25 active:scale-95"
                  >
                    Start Pacer
                  </button>
                </div>
                <p className="text-xs text-slate-300/90 leading-relaxed">Inhale 4s, hold 4s, exhale 4s, hold 4s. Used in high-stress crisis de-escalation to restore autonomic stability.</p>
              </div>

              <div className="bg-dark-900/60 border border-white/[0.04] p-3 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-xs text-indigo-200">Body Shake Release (TRE)</h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-dark-800 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md">💪 2 min</span>
                </div>
                <p className="text-xs text-slate-300/90 leading-relaxed">Stand up and gently shake hands, arms, and legs for 2 minutes. Discharges stored muscular tension and cortisol.</p>
              </div>
            </div>
          )}
        </section>

        {/* Curated Video Library */}
        <VideoSection />

        {/* Micro-Pleasure Log */}
        <section className="glass-card rounded-2xl p-4 border border-brand-500/20">
          <div className="flex items-center space-x-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">Micro-Pleasure Journal</h3>
              <p className="text-[11px] text-slate-400">Notice small, quiet moments of clean satisfaction</p>
            </div>
          </div>
          
          <div className="flex space-x-2 mb-3.5">
            <input 
              type="text" 
              placeholder="What gave you a gentle spark of joy today?" 
              className="flex-1 bg-dark-900/80 border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/80 transition-colors"
              value={newLog}
              onChange={(e) => setNewLog(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveLog()}
            />
            <button 
              onClick={saveLog}
              className="bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 px-3 py-2 rounded-xl border border-brand-500/30 transition-all active:scale-95 flex items-center justify-center shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {pleasureLogs.slice(0, 3).map(log => (
              <div key={log.id} className="bg-dark-900/50 rounded-xl p-2.5 border-l-2 border-l-brand-400 border-y border-r border-white/[0.03] text-xs">
                <p className="text-slate-200">{log.text}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">{new Date(log.date).toLocaleDateString()}</p>
              </div>
            ))}
            {pleasureLogs.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-3 italic">No entries yet. Notice the scent of rain, a warm tea, or a deep breath.</p>
            )}
          </div>
        </section>

        {/* Resources Link */}
        <div className="flex justify-center pt-2">
          <Link to="/resources" className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 transition-colors">
            <span>View Crisis Resources & Helplines</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      {/* Breathing Modal */}
      {breathingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-dark-900 border border-white/[0.08] rounded-3xl p-6 max-w-sm w-full relative shadow-2xl">
            <button 
              onClick={() => setBreathingModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-dark-800 transition-colors z-10"
            >
              ✕
            </button>
            <h3 className="text-center font-bold text-sm text-white mb-6">
              {activeBreathingPattern === 'sigh' ? 'Physiological Sigh (4-7-8)' : 'Box Breathing (4-4-4-4)'}
            </h3>
            
            <BreathingPacer onComplete={() => {
              setTimeout(() => setBreathingModalOpen(false), 2000);
            }} />
            
          </div>
        </div>
      )}

      {/* Urge Surfing Wave Modal */}
      {urgeModalOpen && (
        <UrgeSurfingModal
          triggerTag="General Urge Wave"
          onSurfed={() => setUrgeModalOpen(false)}
          onSlipped={() => setUrgeModalOpen(false)}
          onClose={() => setUrgeModalOpen(false)}
        />
      )}
    </div>
  );
};
