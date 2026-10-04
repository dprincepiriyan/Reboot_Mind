import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocketContext } from '../contexts/SocketContext';
import { Message, chatroomsApi } from '../api/chatrooms';
import { haptics } from '../lib/haptics';
import { notifications } from '../lib/notifications';

interface UseSocketOptions {
  activeChatroomId?: string;
  onMatched?: (chatroomId: string) => void;
  onGraduationOffer?: (data: { chatroom_id: string; milestone_tier: string; offer_id: string }) => void;
  onRoomMerged?: (data: { old_room_id: string; new_room_id: string }) => void;
}

export function useSocket(options?: UseSocketOptions) {
  const { socket, isConnected } = useSocketContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [sosAlert, setSosAlert] = useState<{ display_name: string; level: string } | null>(null);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sosTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeChatroomId = options?.activeChatroomId;

  // Load initial messages via REST API when activeChatroomId changes
  useEffect(() => {
    if (activeChatroomId) {
      chatroomsApi.getMessages(activeChatroomId)
        .then(setMessages)
        .catch(console.error);
    }
  }, [activeChatroomId]);

  const onMatchedRef = useRef(options?.onMatched);
  const onGraduationOfferRef = useRef(options?.onGraduationOffer);
  const onRoomMergedRef = useRef(options?.onRoomMerged);

  useEffect(() => {
    onMatchedRef.current = options?.onMatched;
    onGraduationOfferRef.current = options?.onGraduationOffer;
    onRoomMergedRef.current = options?.onRoomMerged;
  }, [options?.onMatched, options?.onGraduationOffer, options?.onRoomMerged]);

  useEffect(() => {
    if (!socket) return;

    const onMatched = (data: { chatroom_id: string }) => {
      if (onMatchedRef.current) {
        onMatchedRef.current(data.chatroom_id);
      }
    };

    const onRoomHistory = (data: { chatroom_id: string; messages: Message[] }) => {
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      }
    };

    const onReceiveMessage = (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const onUserTyping = (data: { display_name: string }) => {
      setTypingUser(data.display_name);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
    };

    const onSosAlert = (data: { display_name: string; level: string }) => {
      setSosAlert(data);
      haptics.heavy();
      notifications.showSosAlert(data.display_name, data.level);
      if (sosTimeoutRef.current) clearTimeout(sosTimeoutRef.current);
      sosTimeoutRef.current = setTimeout(() => setSosAlert(null), 10000);
    };

    const onGraduationOffer = (data: { chatroom_id: string; milestone_tier: string; offer_id: string }) => {
      if (onGraduationOfferRef.current) {
        onGraduationOfferRef.current(data);
      }
    };

    const onRoomMerged = (data: { old_room_id: string; new_room_id: string }) => {
      if (onRoomMergedRef.current) {
        onRoomMergedRef.current(data);
      }
    };

    // Register ALL listeners BEFORE emitting join_room
    socket.on('matched', onMatched);
    socket.on('room_history', onRoomHistory);
    socket.on('receive_message', onReceiveMessage);
    socket.on('user_typing', onUserTyping);
    socket.on('sos_alert', onSosAlert);
    socket.on('graduation_offer', onGraduationOffer);
    socket.on('room_merged', onRoomMerged);

    // Now emit join_room — listeners are ready to receive room_history
    if (isConnected && activeChatroomId) {
      socket.emit('join_room', { chatroom_id: activeChatroomId });
    }

    return () => {
      socket.off('matched', onMatched);
      socket.off('room_history', onRoomHistory);
      socket.off('receive_message', onReceiveMessage);
      socket.off('user_typing', onUserTyping);
      socket.off('sos_alert', onSosAlert);
      socket.off('graduation_offer', onGraduationOffer);
      socket.off('room_merged', onRoomMerged);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (sosTimeoutRef.current) clearTimeout(sosTimeoutRef.current);
    };
  }, [socket, isConnected, activeChatroomId]);

  const joinRoom = useCallback((chatroomId: string) => {
    if (socket && socket.connected) {
      socket.emit('join_room', { chatroom_id: chatroomId });
    }
  }, [socket]);

  const sendMessage = useCallback((chatroomId: string, content: string) => {
    if (socket && content.trim()) {
      socket.emit('send_message', { chatroom_id: chatroomId, content });
    }
  }, [socket]);

  const sendTyping = useCallback((chatroomId: string) => {
    if (socket) {
      socket.emit('typing', { chatroom_id: chatroomId });
    }
  }, [socket]);

  const triggerSOSAlert = useCallback((chatroomId: string, level: string) => {
    if (socket) {
      haptics.heavy();
      socket.emit('trigger_sos', { chatroom_id: chatroomId, level });
    }
  }, [socket]);

  return {
    isConnected,
    messages,
    typingUser,
    sosAlert,
    joinRoom,
    sendMessage,
    sendTyping,
    triggerSOSAlert,
  };
}
