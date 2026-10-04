import { apiFetch } from './client';

export interface ChatroomMember {
  profile_id: string;
  display_name: string;
  avatar_seed: string;
  equipped_aura?: string;
  equipped_title?: string;
}

export interface Message {
  id: string;
  chatroom_id: string;
  profile_id: string;
  display_name: string;
  avatar_seed: string;
  content: string;
  sent_at: string;
  equipped_aura?: string;
  equipped_title?: string;
}

export interface ChatroomInfo {
  id: string;
  addiction_type: string;
  is_general: boolean;
  created_at: string;
  members: ChatroomMember[];
  last_message?: Message;
}

export interface GraduationOffer {
  id: string;
  chatroom_id: string;
  target_chatroom_id?: string;
  milestone_tier: string;
  status: string;
}

export const chatroomsApi = {
  getUserChatrooms: () => apiFetch<ChatroomInfo[]>('/chatrooms'),
  getMessages: (chatroomId: string) => apiFetch<Message[]>(`/chatrooms/${chatroomId}/messages`),
  getGraduationOffer: (chatroomId: string) => apiFetch<GraduationOffer | null>(`/chatrooms/${chatroomId}/graduation-offer`),
  acceptGraduationOffer: (chatroomId: string) => apiFetch<{ status: string; new_chatroom_id: string }>(`/chatrooms/${chatroomId}/graduation-offer/accept`, { method: 'POST' }),
  declineGraduationOffer: (chatroomId: string) => apiFetch<{ status: string }>(`/chatrooms/${chatroomId}/graduation-offer/decline`, { method: 'POST' }),
};
