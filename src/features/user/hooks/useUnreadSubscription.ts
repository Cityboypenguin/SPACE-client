import { useEffect, useRef } from 'react';

type UnreadUpdate = { roomID: string; unreadCount: number; lastMessage?: string };
type Listener = (update: UnreadUpdate) => void;

const listeners = new Set<Listener>();

// NotificationContext の SSE 接続（unread_room イベント）から呼ばれる
export const emitUnreadRoomUpdate = (update: UnreadUpdate) => {
  for (const listener of listeners) listener(update);
};

export const useUnreadSubscription = (onUpdate: Listener) => {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const listener: Listener = (update) => onUpdateRef.current(update);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
};
