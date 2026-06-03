import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '../../../context/ToastContext';

import { SSE_URL } from '../../../lib/graphql';

type SSENotificationPayload = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  actorID?: string;
  targetType?: string;
  targetID?: string;
};

type NotificationContextValue = {
  unreadCount: number;
  lastSseAt: number;
  resetUnread: () => void;
  decrementUnread: () => void;
};

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  lastSseAt: 0,
  resetUnread: () => {},
  decrementUnread: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSseAt, setLastSseAt] = useState(0);
  const addToastRef = useRef(addToast);
  addToastRef.current = addToast;

  useEffect(() => {
    if (!token) setUnreadCount(0);
  }, [token]);

  const resetUnread = useCallback(() => setUnreadCount(0), []);
  const decrementUnread = useCallback(() => setUnreadCount((c) => Math.max(0, c - 1)), []);

  useEffect(() => {
    if (!token) return;

    const es = new EventSource(`${SSE_URL}?token=${encodeURIComponent(token)}`);

    // 接続・再接続時にサーバーから正確な未読数が sync イベントで届く
    es.addEventListener('sync', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data as string) as { unreadCount: number };
        setUnreadCount(payload.unreadCount);
      } catch {
        // ignore malformed event
      }
    });

    es.addEventListener('notification', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data as string) as SSENotificationPayload & { replayed?: boolean };
        if (payload.replayed) {
          // 再接続時のリプレイ通知はトーストを出さない（sync イベントでバッジ数を補正）
          return;
        }
        setUnreadCount((c) => c + 1);
        setLastSseAt(Date.now());
        const link =
          payload.type === 'announcement' && payload.targetID
            ? `/announcements/${payload.targetID}`
            : `/notifications/${payload.id}`;
        addToastRef.current(payload.message, 'info', 4000, link);
      } catch {
        // ignore malformed event
      }
    });

    return () => es.close();
  }, [token]);

  return (
    <NotificationContext.Provider value={{ unreadCount, lastSseAt, resetUnread, decrementUnread }}>
      {children}
    </NotificationContext.Provider>
  );
};
