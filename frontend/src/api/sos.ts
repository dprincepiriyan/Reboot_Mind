import { apiFetch } from './client';

export interface CrisisResource {
  name: string;
  contact: string;
  type: 'phone' | 'text' | 'web';
  description: string;
}

export interface SOSResponse {
  event_id: string;
  level: 'struggling' | 'urgent';
  triggered_at: string;
  resources?: CrisisResource[];
}

export const sosApi = {
  trigger: (chatroomId: string, level: 'struggling' | 'urgent') =>
    apiFetch<SOSResponse>('/sos', {
      method: 'POST',
      body: JSON.stringify({ chatroom_id: chatroomId, level }),
    }),
};
