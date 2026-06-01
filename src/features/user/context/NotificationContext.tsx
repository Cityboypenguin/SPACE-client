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
import { getUnreadNotificationCount } from '../api/notification';
import { SSE_URL } from '../../../lib/graphql';

type SSENotificationPayload = {
  id: number;
  type: string;
  message: string;
  createdAt: string;
  actorID?: number;
  targetType?: string;
  targetID?: number;
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
    if (!token) {
      setUnreadCount(0);
      return;
    }
    getUnreadNotificationCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, [token]);

  const resetUnread = useCallback(() => setUnreadCount(0), []);
  const decrementUnread = useCallback(() => setUnreadCount((c) => Math.max(0, c - 1)), []);

  useEffect(() => {
    if (!token) return;

    const es = new EventSource(`${SSE_URL}?token=${encodeURIComponent(token)}`);

    es.addEventListener('notification', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data as string) as SSENotificationPayload;
        setUnreadCount((c) => c + 1);
        setLastSseAt(Date.now());
        addToastRef.current(payload.message, 'info');
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
