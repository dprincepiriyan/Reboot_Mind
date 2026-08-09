import { apiFetch } from './client';

export interface DailyTask {
  id: string;
  task_text: string;
  addiction_type?: string;
  completed: boolean;
}

export const tasksApi = {
  getDailyTasks: () => apiFetch<DailyTask[]>('/tasks/daily'),
  completeTask: (taskId: string) =>
    apiFetch<{ status: string }>(`/tasks/${taskId}/complete`, {
      method: 'POST',
    }),
};
