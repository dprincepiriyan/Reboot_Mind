import { apiFetch } from './client';

export interface Profile {
  id: string;
  display_name: string;
  avatar_seed: string;
  created_at: string;
  has_completed_questionnaire: boolean;
  chatroom_id?: string;
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
};
