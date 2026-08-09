import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wine, Cigarette, Gamepad2, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';
import { questionnaireApi } from '../api/questionnaire';
import { useSocket } from '../hooks/useSocket';

export const Questionnaire: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [addictionType, setAddictionType] = useState('alcohol');
  const [frequency, setFrequency] = useState('daily');
  const [disclosed, setDisclosed] = useState(false);
  const [knowsSimilar, setKnowsSimilar] = useState(false);
  const [onsetDescription, setOnsetDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSocket({
    onMatched: (chatroomId) => {
      navigate(`/chatroom/${chatroomId}`);
    }
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await questionnaireApi.submit({
        addiction_type: addictionType,
        frequency,
        disclosed_to_others: disclosed,
        knows_similar_others: knowsSimilar,
        onset_description: onsetDescription,
      });

      if (res.matched && res.chatroom_id) {
        navigate(`/chatroom/${res.chatroom_id}`);
      } else {
        setIsWaitingForMatch(true);
      }
    } catch (err) {
      console.error('Failed to submit questionnaire:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isWaitingForMatch) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full rounded-3xl p-8 border border-slate-700/60 shadow-2xl text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
            <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">Algorithmic Matching in Progress</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              We are pairing your profile with 2-3 members struggling with similar severity in <strong>{addictionType}</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-dark-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-emerald-400">Total Anonymity Guarantee</div>
            <div>Your real identity will never be visible to matched members.</div>
          </div>

          <button
            onClick={() => navigate('/chatrooms')}
            className="w-full py-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-slate-300 font-medium text-xs transition-colors"
          >
            Go to Chatroom Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full rounded-3xl p-8 border border-slate-700/60 shadow-2xl space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>Step {step} of 3</span>
            <span className="text-emerald-400">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-dark-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-teal-400 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Addiction Category */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold text-white">Select Struggle Category</h3>
              <p className="text-xs text-slate-400 mt-1">This determines your support circle matching pool.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'alcohol', title: 'Alcohol', desc: 'Struggling with alcohol intake or drinking habits.', icon: Wine },
                { id: 'smoking', title: 'Smoking / Nicotine', desc: 'Vaping, cigarettes, or tobacco dependence.', icon: Cigarette },
                { id: 'gaming', title: 'Gaming / Screen', desc: 'Excessive gaming or digital media screen time.', icon: Gamepad2 },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = addictionType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAddictionType(item.id)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-950/30 border-brand-500 shadow-md shadow-emerald-950/20'
                        : 'bg-dark-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${isSelected ? 'text-emerald-400' : 'text-white'}`}>{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              <span>Next: Frequency & Context</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Frequency & Social Context */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold text-white">Frequency & Context</h3>
              <p className="text-xs text-slate-400 mt-1">Helps us match you with members facing similar intensity.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">How often do you struggle with this?</label>
                <div className="grid grid-cols-2 gap-2">
                  {['daily', 'weekly', 'monthly', 'rarely'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        frequency === f
                          ? 'bg-brand-600 text-white border-brand-500'
                          : 'bg-dark-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-dark-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disclosed}
                    onChange={(e) => setDisclosed(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-0 accent-emerald-500"
                  />
                  <span className="text-xs text-slate-300">I have disclosed this struggle to friends/family.</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-dark-900/60 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={knowsSimilar}
                    onChange={(e) => setKnowsSimilar(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-0 accent-emerald-500"
                  />
                  <span className="text-xs text-slate-300">I personally know others going through similar challenges.</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl bg-dark-800 text-slate-300 font-semibold text-xs"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <span>Next: Personal Note</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Onset Description */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold text-white">Your Personal Note (Optional)</h3>
              <p className="text-xs text-slate-400 mt-1">Describe when your struggle started or what you hope to achieve.</p>
            </div>

            <textarea
              rows={4}
              value={onsetDescription}
              onChange={(e) => setOnsetDescription(e.target.value)}
              placeholder="e.g. Started around 6 months ago during exams, hoping to build healthy daily routines..."
              className="w-full bg-dark-900/80 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 py-3 rounded-xl bg-dark-800 text-slate-300 font-semibold text-xs"
              >
                Back
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Matching...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Match</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
