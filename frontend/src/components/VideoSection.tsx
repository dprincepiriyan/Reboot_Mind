import React, { useState } from 'react';
import { Play, Tv, X, Sparkles, ExternalLink } from 'lucide-react';

export interface VideoResource {
  id: string; // YouTube Video ID
  title: string;
  creator: string;
  duration: string;
  category: 'Neuroscience' | 'Psychology' | 'Somatic & Yoga' | 'Motivation';
  thumbnailUrl: string;
  description: string;
}

export const FEATURED_VIDEOS: VideoResource[] = [
  {
    id: 'H877DXOAlXI',
    title: 'How to Break Any Addiction',
    creator: 'Dr. K (HealthyGamerGG)',
    duration: '24 min',
    category: 'Psychology',
    thumbnailUrl: 'https://img.youtube.com/vi/H877DXOAlXI/hqdefault.jpg',
    description: 'Psychiatrist Dr. K breaks down the neurobiology of dopamine loops, emotional numbing, and practical steps to regain control over compulsive behaviors.'
  },
  {
    id: 'p3JLaF_4tGM',
    title: 'Understanding & Controlling Dopamine',
    creator: 'Dr. Andrew Huberman (Stanford)',
    duration: '15 min excerpt',
    category: 'Neuroscience',
    thumbnailUrl: 'https://img.youtube.com/vi/p3JLaF_4tGM/hqdefault.jpg',
    description: 'Stanford neurobiologist Dr. Huberman explains how dopamine baselines drive cravings and how cold exposure & effort resensitize your brain.'
  },
  {
    id: 'PY9DcIMGxMs',
    title: 'Everything You Think You Know About Addiction is Wrong',
    creator: 'Johann Hari (TED)',
    duration: '14 min',
    category: 'Motivation',
    thumbnailUrl: 'https://img.youtube.com/vi/PY9DcIMGxMs/hqdefault.jpg',
    description: 'The landmark TED talk exploring why the opposite of addiction is not sobriety — the opposite of addiction is human connection.'
  },
  {
    id: 'bJJWArRfKa0',
    title: 'Yoga for Anxiety & Stress Relief',
    creator: 'Yoga With Adriene',
    duration: '20 min',
    category: 'Somatic & Yoga',
    thumbnailUrl: 'https://img.youtube.com/vi/bJJWArRfKa0/hqdefault.jpg',
    description: 'A gentle, grounding somatic yoga practice designed to calm an overstimulated nervous system and ride out intense physical urges.'
  }
];

export const VideoSection: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<VideoResource | null>(null);

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400">
            <Tv className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">Curated Recovery Library</h3>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 font-semibold flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          <span>Distraction-Free</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {FEATURED_VIDEOS.map((video) => (
          <div
            key={video.id}
            onClick={() => setActiveVideo(video)}
            className="group glass-card rounded-2xl border border-white/[0.05] hover:border-rose-500/30 overflow-hidden cursor-pointer transition-all duration-200 flex flex-col shadow-surface-sm"
          >
            {/* Thumbnail Box with Play Badge */}
            <div className="relative aspect-video bg-dark-950 overflow-hidden">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent"></div>
              
              {/* Category Badge */}
              <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md bg-dark-900/80 backdrop-blur-md text-slate-200 border border-white/[0.08]">
                {video.category}
              </span>

              {/* Play Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg shadow-rose-950/50 group-hover:scale-110 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>

              {/* Duration badge */}
              <span className="absolute bottom-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-dark-950/80 text-slate-300 font-mono">
                {video.duration}
              </span>
            </div>

            {/* Meta */}
            <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-xs text-white group-hover:text-rose-300 transition-colors line-clamp-1">
                  {video.title}
                </h4>
                <p className="text-[10px] text-rose-400 font-medium">{video.creator}</p>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed pt-1">
                {video.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Embedded Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-dark-900 border border-white/[0.08] rounded-3xl max-w-xl w-full p-4 space-y-3 shadow-surface-lg relative">
            <div className="flex items-center justify-between pb-1">
              <div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                  {activeVideo.category}
                </span>
                <h3 className="font-bold text-xs text-white mt-1">{activeVideo.title}</h3>
                <p className="text-[10px] text-slate-400">{activeVideo.creator}</p>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-xl bg-dark-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Embedded Iframe Player (YouTube No-Cookie for Privacy) */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/[0.06] shadow-inner">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              ></iframe>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Watching inside Reboot Mind (Privacy-Protected Player)</span>
              <a
                href={`https://www.youtube.com/watch?v=${activeVideo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
