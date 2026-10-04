import React, { useState } from 'react';
import { Library, Phone, Wind, BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { VideoSection } from '../components/VideoSection';

type AddictionType = 'general' | 'alcohol' | 'smoking' | 'gaming';

interface Resource {
  name: string;
  description: string;
  phone?: string;
  url?: string;
  hours?: string;
}

interface CopingStrategy {
  title: string;
  steps: string[];
  duration?: string;
}

interface ResourceData {
  hotlines: Resource[];
  coping: CopingStrategy[];
  reads: Resource[];
}

const RESOURCES: Record<AddictionType, ResourceData> = {
  general: {
    hotlines: [
      { name: 'SAMHSA National Helpline', description: 'Free, confidential, 24/7 treatment referral service for substance use disorders.', phone: '1-800-662-4357', hours: '24/7 Free & Confidential' },
      { name: 'Crisis Text Line', description: 'Text HOME to 741741 to connect with a Crisis Counselor in the US.', phone: 'Text HOME to 741741', hours: '24/7' },
      { name: 'National Alliance on Mental Illness (NAMI)', description: 'Mental health support, education, and advocacy.', phone: '1-800-950-NAMI', url: 'https://nami.org', hours: 'Mon–Fri 10am–10pm ET' },
    ],
    coping: [
      {
        title: '4-7-8 Breathing Exercise',
        duration: '2 minutes',
        steps: [
          'Find a comfortable seated position and close your eyes.',
          'Exhale completely through your mouth.',
          'Close your mouth and inhale through your nose for 4 counts.',
          'Hold your breath for 7 counts.',
          'Exhale completely through your mouth for 8 counts.',
          'Repeat 3–4 cycles. This activates your parasympathetic nervous system.'
        ]
      },
      {
        title: '5-4-3-2-1 Grounding Technique',
        duration: '3–5 minutes',
        steps: [
          '5 things you can SEE around you right now.',
          '4 things you can TOUCH (feel the texture).',
          '3 things you can HEAR in the environment.',
          '2 things you can SMELL (or scents you like).',
          '1 thing you can TASTE.',
          'This brings your attention to the present moment, breaking the craving cycle.'
        ]
      },
      {
        title: 'HALT Check-In',
        duration: '1 minute',
        steps: [
          'Before acting on a craving, ask yourself:',
          'Am I Hungry? Eat something nourishing.',
          'Am I Angry? Acknowledge the feeling without acting on it.',
          'Am I Lonely? Reach out to someone — even a text counts.',
          'Am I Tired? Rest without guilt.',
          'Often, the craving is signaling an unmet basic need.'
        ]
      }
    ],
    reads: [
      { name: 'Addiction & the Brain', description: 'Mayo Clinic\'s guide to how addiction changes brain chemistry and function.', url: 'https://www.mayoclinic.org/diseases-conditions/drug-addiction/symptoms-causes/syc-20365112' },
      { name: 'The Science of Habits', description: 'NIH research on how habits form and how to break addictive loops.', url: 'https://www.nih.gov/news-events/nih-research-matters/understanding-drug-use-addiction' },
      { name: 'Recovery is Possible', description: 'SAMHSA\'s overview of what recovery looks like across all types of substance use.', url: 'https://www.samhsa.gov/find-help/recovery' },
    ]
  },
  alcohol: {
    hotlines: [
      { name: 'Alcoholics Anonymous (AA)', description: 'Worldwide fellowship of people who share their experience to solve common problems and help others recover.', url: 'https://www.aa.org', hours: 'Meetings available 24/7 globally' },
      { name: 'SAMHSA Alcohol Line', description: 'Free, confidential help for alcohol use disorders, treatment referrals, and information.', phone: '1-800-662-4357', hours: '24/7' },
      { name: 'Al-Anon Family Groups', description: 'Support for families and friends of people with alcohol problems.', phone: '1-888-4AL-ANON', url: 'https://al-anon.org', hours: '24/7' },
    ],
    coping: [
      {
        title: 'Urge Surfing',
        duration: '5–10 minutes',
        steps: [
          'When you feel the urge to drink, don\'t try to fight it.',
          'Close your eyes and observe the craving like an ocean wave.',
          'Notice where you feel it in your body (chest, stomach, throat?).',
          'Breathe slowly and watch the sensation grow, peak, and then fall.',
          'Most cravings peak within 20–30 minutes and then pass.',
          'You don\'t have to act on the wave — just ride it out.'
        ]
      },
      {
        title: 'Replace the Ritual',
        duration: 'Ongoing',
        steps: [
          'Identify when you typically drink (evening, social settings, stress).',
          'Prepare a non-alcoholic ritual for that same time: sparkling water with lime, herbal tea, mocktail.',
          'The act of holding a glass and sipping satisfies part of the habit loop.',
          'Over time, the new ritual replaces the old one at the neurological level.'
        ]
      }
    ],
    reads: [
      { name: 'Alcohol Use Disorder', description: 'NHS comprehensive guide to alcohol dependency, health effects, and treatment paths.', url: 'https://www.nhs.uk/conditions/alcohol-misuse/' },
      { name: 'Effects of Alcohol on Health', description: 'CDC overview of short and long-term health risks from alcohol consumption.', url: 'https://www.cdc.gov/alcohol/fact-sheets/alcohol-use.htm' },
    ]
  },
  smoking: {
    hotlines: [
      { name: 'Smokefree.gov Quitline', description: 'Free coaching, medications (in some states), and text-based support to quit smoking.', phone: '1-800-QUIT-NOW', url: 'https://smokefree.gov', hours: '24/7 Online, Business hours for calls' },
      { name: 'NHS Stop Smoking Services', description: 'NHS-backed local stop smoking services with counsellors and approved medications.', url: 'https://www.nhs.uk/live-well/quit-smoking/nhs-stop-smoking-services-help-you-quit/', hours: 'Varies by location' },
    ],
    coping: [
      {
        title: 'The 4 Ds for Cravings',
        duration: 'As needed',
        steps: [
          'DELAY: Tell yourself to wait 10 minutes. Most cravings pass by then.',
          'DEEP BREATH: Take 10 slow, deep breaths — mimics the physical act of smoking.',
          'DRINK WATER: Sip cold water slowly to distract and hydrate.',
          'DO SOMETHING: Change your environment or activity immediately.',
          'These four responses interrupt the craving loop before it escalates.'
        ]
      },
      {
        title: 'Nicotine Replacement Schedule',
        duration: 'Days 1–12',
        steps: [
          'Week 1: Use full-strength nicotine patches/gum as directed.',
          'Week 2: Step down to mid-strength replacement.',
          'Week 3–4: Transition to low-strength or eliminate.',
          'Track when you feel cravings and what preceded them.',
          'Use your Reboot Mind journal to log your triggers and victories each day.'
        ]
      }
    ],
    reads: [
      { name: 'Health Benefits of Quitting', description: 'CDC timeline of what happens to your body when you quit smoking — hour by hour, year by year.', url: 'https://www.cdc.gov/tobacco/quit_smoking/how_to_quit/benefits/index.htm' },
      { name: 'Medications to Help Quit', description: 'FDA guide to approved medications and nicotine therapies for quitting smoking.', url: 'https://www.fda.gov/tobacco-products/health-effects-tobacco-use/stop-smoking-aids' },
    ]
  },
  gaming: {
    hotlines: [
      { name: 'On-Line Gamers Anonymous', description: 'Fellowship for compulsive gamers and their loved ones, with meetings and online support.', url: 'https://www.olganon.org', hours: 'Multiple meeting times daily' },
      { name: 'SAMHSA Helpline (Behavioral)', description: 'Covers behavioral addictions including gaming disorder. Free, confidential referrals.', phone: '1-800-662-4357', hours: '24/7' },
    ],
    coping: [
      {
        title: 'Time-Boxed Play Protocol',
        duration: 'Ongoing habit',
        steps: [
          'Set an external timer before every session (not in-game timer — those are designed to be ignored).',
          'Place your phone in another room when the timer goes off.',
          'Write down in your Reboot Mind journal how you feel 30 minutes after stopping.',
          'Build in a mandatory 1-hour non-screen activity between sessions.',
          'Track your total daily screen time in a visible place (whiteboard, notes app).'
        ]
      },
      {
        title: 'Dopamine Reset Day',
        duration: '1 full day weekly',
        steps: [
          'Choose one day per week as a no-gaming day.',
          'Plan specific high-dopamine offline activities in advance (exercise, cooking, nature walk).',
          'Notice how you feel the evening of your reset day vs a heavy gaming day.',
          'Gradually your brain re-learns to enjoy offline rewards.',
          'This rebuilds the dopamine baseline that excessive gaming depresses over time.'
        ]
      }
    ],
    reads: [
      { name: 'Gaming Disorder — WHO', description: 'World Health Organization\'s official classification and definition of gaming disorder.', url: 'https://www.who.int/news-room/questions-and-answers/item/addictive-behaviours-gaming-disorder' },
      { name: 'Digital Wellness Lab', description: 'Research-backed resources for building a healthy relationship with technology.', url: 'https://digitalwellnesslab.org' },
    ]
  }
};

const TAB_CONFIG: { key: AddictionType; label: string; emoji: string }[] = [
  { key: 'general', label: 'General', emoji: '🌿' },
  { key: 'alcohol', label: 'Alcohol', emoji: '🍷' },
  { key: 'smoking', label: 'Smoking', emoji: '🚬' },
  { key: 'gaming', label: 'Gaming', emoji: '🎮' },
];

const AccordionSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, icon, children, defaultOpen = false
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-bold text-white">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t border-slate-800/50">{children}</div>}
    </div>
  );
};

export const Resources: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AddictionType>('general');
  const data = RESOURCES[activeTab];

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Library className="w-5 h-5 text-amber-400" />
        <h2 className="font-extrabold text-base text-white">Resource Library</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap text-xs font-bold border transition-all shrink-0 ${
              activeTab === tab.key
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-dark-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Crisis Hotlines */}
      <AccordionSection
        title="Crisis Hotlines & Support Lines"
        icon={<Phone className="w-4 h-4 text-red-400" />}
        defaultOpen
      >
        <div className="space-y-3 pt-3">
          {data.hotlines.map((h, i) => (
            <div key={i} className="p-3 rounded-xl bg-dark-800/50 border border-slate-700/50 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-white">{h.name}</h4>
                {h.url && (
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{h.description}</p>
              {h.phone && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] font-bold text-emerald-400">{h.phone}</span>
                </div>
              )}
              {h.hours && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-500 border border-slate-700/50">{h.hours}</span>
              )}
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* Coping Strategies */}
      <AccordionSection
        title="Coping Strategies & Techniques"
        icon={<Wind className="w-4 h-4 text-teal-400" />}
        defaultOpen
      >
        <div className="space-y-3 pt-3">
          {data.coping.map((s, i) => (
            <div key={i} className="p-3 rounded-xl bg-dark-800/50 border border-teal-500/10 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{s.title}</h4>
                {s.duration && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 font-semibold">{s.duration}</span>
                )}
              </div>
              <ol className="space-y-1.5">
                {s.steps.map((step, si) => (
                  <li key={si} className="flex gap-2 text-[11px] text-slate-300 leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-400 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{si + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* Educational Reads */}
      <AccordionSection
        title="Educational Reads"
        icon={<BookOpen className="w-4 h-4 text-indigo-400" />}
      >
        <div className="space-y-2 pt-3">
          {data.reads.map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 p-3 rounded-xl bg-dark-800/50 border border-slate-700/50 hover:border-indigo-500/40 transition-all group"
            >
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">{r.name}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{r.description}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      </AccordionSection>

      {/* Curated Video Library */}
      <VideoSection />

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-600 text-center leading-relaxed px-2">
        These resources are curated for general informational purposes. In a medical emergency, always call your local emergency number.
      </p>
    </div>
  );
};
