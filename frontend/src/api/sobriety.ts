import { apiFetch } from './client';

export interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  days_required: number;
}

export interface SobrietyStatus {
  streak_days: number;
  start_date?: string;
  last_reset?: string;
  last_checkin?: string;
  checkin_today: boolean;
  badges: MilestoneBadge[];
}

export interface SobrietyLog {
  id: string;
  event_type: string;
  event_at: string;
  note?: string;
  trigger_tag?: string;
}

export interface SobrietySummary {
  current_streak_days: number;
  longest_streak_days: number;
  total_checkins: number;
  recent_events: SobrietyLog[];
}

export interface SobrietyPatterns {
  trigger_counts: Record<string, number>;
  day_counts: Record<number, number>;
  hour_counts: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

export const sobrietyApi = {
  logEvent: (eventType: 'start' | 'reset' | 'checkin' | 'relapse' | 'craving', note?: string, triggerTag?: string) =>
    apiFetch<SobrietyLog>('/sobriety/log', {
      method: 'POST',
      body: JSON.stringify({ event_type: eventType, note, trigger_tag: triggerTag }),
    }),

  getStatus: () => apiFetch<SobrietyStatus>('/sobriety/status'),
  getLogs: () => apiFetch<SobrietyLog[]>('/sobriety/logs'),
  getSummary: () => apiFetch<SobrietySummary>('/sobriety/summary'),
  logRelapse: () => apiFetch<SobrietyLog>('/sobriety/relapse', { method: 'POST' }),
  logCraving: (triggerTag: string, note?: string) =>
    apiFetch<SobrietyLog>('/sobriety/craving', {
      method: 'POST',
      body: JSON.stringify({ event_type: 'craving', trigger_tag: triggerTag, note }),
    }),
  getPatterns: () => apiFetch<SobrietyPatterns>('/sobriety/patterns'),
};
