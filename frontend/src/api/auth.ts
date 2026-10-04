import { apiFetch } from './client';

export interface Profile {
  id: string;
  display_name: string;
  avatar_seed: string;
  created_at: string;
  has_completed_questionnaire: boolean;
  chatroom_id?: string;
  equipped_aura: string;
  equipped_title: string;
  longest_streak_days: number;
}

export interface RewardItem {
  id: string;
  name: string;
  type: 'aura' | 'title';
  description: string;
  days_required: number;
  unlocked: boolean;
  equipped: boolean;
}

export interface RewardsResponse {
  max_streak_days: number;
  equipped_aura: string;
  equipped_title: string;
  auras: RewardItem[];
  titles: RewardItem[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  signup: (email: string, password: string) => 
    apiFetch<TokenResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) => 
    apiFetch<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => apiFetch<Profile>('/auth/me'),

  getRewards: () => apiFetch<RewardsResponse>('/auth/rewards'),

  equipReward: (aura: string, title: string) =>
    apiFetch<{ status: string; equipped_aura: string; equipped_title: string }>('/auth/rewards/equip', {
      method: 'POST',
      body: JSON.stringify({ aura, title }),
    }),
};
