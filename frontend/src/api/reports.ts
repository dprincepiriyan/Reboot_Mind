import { apiFetch } from './client';

export interface WeeklyReport {
  current_streak_days: number;
  longest_streak_days: number;
  total_checkins: number;
  checkins_this_week: number;
  relapses_this_week: number;
  tasks_completed_this_week: number;
  top_trigger_this_week?: string;
  avg_mood_this_week?: number;
  motivational_message: string;
  week_start: string;
  week_end: string;
  daily_checkin_map: Record<string, boolean>;
}

export const reportsApi = {
  getWeeklyReport: () => apiFetch<WeeklyReport>('/reports/weekly'),
};
