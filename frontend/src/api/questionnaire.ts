import { apiFetch } from './client';

export interface QuestionnaireSubmitPayload {
  addiction_type: string;
  onset_description?: string;
  frequency: string;
  awareness_date?: string;
  disclosed_to_others: boolean;
  knows_similar_others: boolean;
}

export interface QuestionnaireStatus {
  has_submitted: boolean;
  matched: boolean;
  chatroom_id?: string;
}

export const questionnaireApi = {
  submit: (data: QuestionnaireSubmitPayload) =>
    apiFetch<QuestionnaireStatus>('/questionnaire', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStatus: () => apiFetch<QuestionnaireStatus>('/questionnaire/status'),
};
