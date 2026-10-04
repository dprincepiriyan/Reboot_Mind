import { apiFetch } from './client';

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  mood?: number;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryCreate {
  title?: string;
  content: string;
  mood?: number;
}

export const journalApi = {
  list: () => apiFetch<JournalEntry[]>('/journal'),

  create: (data: JournalEntryCreate) =>
    apiFetch<JournalEntry>('/journal', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<JournalEntryCreate>) =>
    apiFetch<JournalEntry>(`/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ status: string }>(`/journal/${id}`, { method: 'DELETE' }),
};
