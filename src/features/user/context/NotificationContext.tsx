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
import { getMyTermsConsentStatus, type TermsOfService } from '../api/terms';
import { emitUnreadRoomUpdate } from '../hooks/useUnreadSubscription';

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
  pendingTerms: TermsOfService | null;
  consentChecking: boolean;
  clearPendingTerms: () => void;
  resetUnread: () => void;
  decrementUnread: () => void;
};

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  lastSseAt: 0,
  pendingTerms: null,
  consentChecking: false,
  clearPendingTerms: () => {},
  resetUnread: () => {},
  decrementUnread: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSseAt, setLastSseAt] = useState(0);
  const [pendingTerms, setPendingTerms] = useState<TermsOfService | null>(null);
  const [consentChecking, setConsentChecking] = useState(false);
  const addToastRef = useRef(addToast);
  addToastRef.current = addToast;

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      setPendingTerms(null);
      return;
    }
    setConsentChecking(true);
    getMyTermsConsentStatus()
      .then((status) => {
        setPendingTerms(!status.isConsented && status.currentTerms ? status.currentTerms : null);
      })
      .catch(() => {})
      .finally(() => setConsentChecking(false));
  }, [token]);

  const clearPendingTerms = useCallback(() => setPendingTerms(null), []);
  const resetUnread = useCallback(() => setUnreadCount(0), []);
  const decrementUnread = useCallback(() => setUnreadCount((c) => Math.max(0, c - 1)), []);

  useEffect(() => {
    if (!token) return;

    const es = new EventSource(`${SSE_URL}?token=${encodeURIComponent(token)}`);

    es.onerror = (e) => {
      console.warn('[SSE] connection error', e, 'readyState:', es.readyState);
    };

    es.addEventListener('sync', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data as string) as { unreadCount: number };
        setUnreadCount(payload.unreadCount);
      } catch {
        // ignore malformed event
      }
    });

    const refreshConsent = () => {
      getMyTermsConsentStatus()
        .then((status) => {
          setPendingTerms(!status.isConsented && status.currentTerms ? status.currentTerms : null);
        })
        .catch(() => {});
    };

    // 初回接続は [token] useEffect 側がすでに呼んでいるためスキップし、再接続時のみ確認する
    let isFirstConnect = true;
    es.addEventListener('connected', () => {
      console.log('[SSE] connected');
      if (isFirstConnect) {
        isFirstConnect = false;
        return;
      }
      refreshConsent();
    });
    es.addEventListener('terms_updated', refreshConsent);

    es.addEventListener('unread_room', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data as string) as { roomID: string; unreadCount: number };
        emitUnreadRoomUpdate(payload);
      } catch {
        // ignore malformed event
      }
    });

    es.addEventListener('notification', (e: MessageEvent) => {
      console.log('[SSE] notification raw data:', e.data);
      try {
        const payload = JSON.parse(e.data as string) as SSENotificationPayload & { replayed?: boolean };
        console.log('[SSE] notification parsed:', payload);
        if (payload.replayed) {
          console.log('[SSE] skipping replayed notification');
          return;
        }
        setUnreadCount((c) => c + 1);
        setLastSseAt(Date.now());
        const link =
          payload.type === 'announcement' && payload.targetID
            ? `/announcements/${payload.targetID}`
            : `/notifications/${payload.id}`;
        console.log('[SSE] calling addToast:', payload.message, link);
        addToastRef.current(payload.message, 'info', 4000, link);
      } catch (err) {
        console.error('[SSE] failed to parse notification:', err, e.data);
      }
    });

    return () => es.close();
  }, [token]);

  return (
    <NotificationContext.Provider value={{ unreadCount, lastSseAt, pendingTerms, consentChecking, clearPendingTerms, resetUnread, decrementUnread }}>
      {children}
    </NotificationContext.Provider>
  );
};
