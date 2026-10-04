import { apiFetch } from './client';

export interface IfThenPlan {
  id: string;
  trigger_tag: string;
  coping_action: string;
  created_at: string;
  updated_at: string;
}

export const ifthenApi = {
  list: () => apiFetch<IfThenPlan[]>('/ifthen'),

  upsert: (trigger_tag: string, coping_action: string) =>
    apiFetch<IfThenPlan>('/ifthen', {
      method: 'POST',
      body: JSON.stringify({ trigger_tag, coping_action }),
    }),

  delete: (id: string) =>
    apiFetch<{ status: string }>(`/ifthen/${id}`, {
      method: 'DELETE',
    }),
};
