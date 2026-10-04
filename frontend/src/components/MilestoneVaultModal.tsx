import React, { useEffect, useState } from 'react';
import { Award, Sparkles, Check, Lock, X, Shield, Star, Crown } from 'lucide-react';
import { authApi, RewardsResponse, RewardItem } from '../api/auth';

interface MilestoneVaultModalProps {
  onClose: () => void;
  onEquipped: (aura: string, title: string) => void;
}

export const AURA_STYLES: Record<string, { ring: string; badgeBg: string; textColor: string; label: string }> = {
  default: { ring: 'ring-1 ring-slate-600', badgeBg: 'bg-slate-800', textColor: 'text-slate-300', label: 'Natural Mist' },
  emerald: { ring: 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/40', badgeBg: 'bg-emerald-950/80 border border-emerald-500/40', textColor: 'text-emerald-300', label: 'Emerald Glow' },
  cyan: { ring: 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/40', badgeBg: 'bg-cyan-950/80 border border-cyan-500/40', textColor: 'text-cyan-300', label: 'Cyan Frost' },
  amethyst: { ring: 'ring-2 ring-purple-400 shadow-lg shadow-purple-500/40', badgeBg: 'bg-purple-950/80 border border-purple-500/40', textColor: 'text-purple-300', label: 'Amethyst Flame' },
  gold: { ring: 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/50', badgeBg: 'bg-amber-950/80 border border-amber-500/40', textColor: 'text-amber-300', label: 'Golden Halo' },
  phoenix: { ring: 'ring-2 ring-rose-500 shadow-lg shadow-rose-600/50 animate-pulse', badgeBg: 'bg-rose-950/80 border border-rose-500/40', textColor: 'text-rose-300', label: 'Phoenix Fire' },
};

export const MilestoneVaultModal: React.FC<MilestoneVaultModalProps> = ({ onClose, onEquipped }) => {
  const [data, setData] = useState<RewardsResponse | null>(null);
  const [selectedAura, setSelectedAura] = useState<string>('default');
  const [selectedTitle, setSelectedTitle] = useState<string>('The Seeker');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    authApi.getRewards()
      .then((res) => {
        setData(res);
        setSelectedAura(res.equipped_aura);
        setSelectedTitle(res.equipped_title);
      })
      .catch((err) => {
        console.error('Failed to load rewards:', err);
        setError('Failed to load cosmetic rewards.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleEquip = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await authApi.equipReward(selectedAura, selectedTitle);
      setSuccessMsg('Equipped successfully!');
      onEquipped(selectedAura, selectedTitle);
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      console.error('Failed to equip rewards:', err);
      setError(err?.message || 'Failed to equip cosmetics.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="glass-card max-w-sm w-full p-8 rounded-3xl text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Opening Milestone Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-dark-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <span>Milestone Dressing Room</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {data?.max_streak_days || 0} Days Peak
              </span>
            </h3>
            <p className="text-xs text-slate-400">Unlock cosmic auras & titles as your streak expands.</p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 text-center">
            {successMsg}
          </div>
        )}

        {/* Preview Avatar Box */}
        <div className="p-4 rounded-2xl bg-dark-800/80 border border-slate-800 flex items-center justify-around">
          <div className="flex items-center gap-3.5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-black text-white bg-gradient-to-br from-emerald-500 to-teal-700 transition-all ${AURA_STYLES[selectedAura]?.ring}`}>
              YOU
            </div>
            <div>
              <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>Your Name</span>
              </div>
              <div className={`text-[11px] font-bold ${AURA_STYLES[selectedAura]?.textColor}`}>
                {selectedTitle}
              </div>
              <div className="text-[10px] text-slate-500">
                Aura: {AURA_STYLES[selectedAura]?.label}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Cosmetic Auras */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Cosmetic Aura Rings</span>
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {data?.auras.map((aura) => {
              const isSelected = selectedAura === aura.id;
              return (
                <button
                  key={aura.id}
                  disabled={!aura.unlocked}
                  onClick={() => setSelectedAura(aura.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-brand-500 bg-brand-500/10'
                      : aura.unlocked
                      ? 'border-slate-700 bg-dark-800/60 hover:bg-dark-800'
                      : 'border-slate-800/60 bg-dark-950/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{aura.name}</span>
                    {aura.unlocked ? (
                      isSelected && <Check className="w-3.5 h-3.5 text-brand-400" />
                    ) : (
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                        <Lock className="w-3 h-3" />
                        <span>{aura.days_required}d</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                    {aura.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Honorific Titles */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Honorific Titles</span>
          </h4>

          <div className="grid grid-cols-2 gap-2">
            {data?.titles.map((title) => {
              const isSelected = selectedTitle === title.name;
              return (
                <button
                  key={title.id}
                  disabled={!title.unlocked}
                  onClick={() => setSelectedTitle(title.name)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : title.unlocked
                      ? 'border-slate-700 bg-dark-800/60 hover:bg-dark-800'
                      : 'border-slate-800/60 bg-dark-950/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{title.name}</span>
                    {title.unlocked ? (
                      isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                        <Lock className="w-3 h-3" />
                        <span>{title.days_required}d</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                    {title.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-800">
          <button
            disabled={isSaving}
            onClick={handleEquip}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'Equipping...' : 'Equip Selected Appearance'}
          </button>
        </div>
      </div>
    </div>
  );
};
