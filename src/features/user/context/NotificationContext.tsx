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

import { SSE_URL, refreshUserAccessToken } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from '../../../lib/authStorage';

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

    // --- 堅牢な SSE 接続管理 ---
    // ネイティブ EventSource は 401/429 など 2xx 以外の応答を受けると readyState=CLOSED で
    // 永久停止し、自動再接続しない。さらに再接続時は古い（期限切れの）アクセストークンを使うため
    // 「切断 → 期限切れトークンで再接続 → 401 → 永久停止」に陥る。
    // そこで自前で接続ライフサイクルを管理し、再接続前に必ずトークンをリフレッシュする。
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let hiddenCloseTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    let stopped = false; // cleanup 後に再接続コールバックが走るのを防ぐ

    const MAX_BACKOFF = 30_000;
    const HIDDEN_GRACE = 60_000; // タブが hidden のままこの時間を超えたら接続を畳む

    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const closeES = () => {
      if (es) {
        es.close();
        es = null;
      }
    };

    const refreshConsent = () => {
      getMyTermsConsentStatus()
        .then((status) => {
          setPendingTerms(!status.isConsented && status.currentTerms ? status.currentTerms : null);
        })
        .catch(() => {});
    };

    // 初回接続は [token] useEffect 側がすでに consent を確認済みなのでスキップする
    let isFirstConnect = true;

    const connect = () => {
      if (stopped) return;
      clearReconnectTimer();
      closeES(); // 再接続の直前に必ず古い接続を閉じてゾンビ接続を防ぐ

      // 常に localStorage の最新トークンで張る（リフレッシュ後の新トークンを確実に使う）
      const current = localStorage.getItem(USER_TOKEN_KEY);
      if (!current) return;

      const source = new EventSource(`${SSE_URL}?token=${encodeURIComponent(current)}`);
      es = source;

      source.addEventListener('connected', () => {
        console.log('[SSE] connected');
        retryCount = 0; // 正常接続でバックオフをリセット
        if (isFirstConnect) {
          isFirstConnect = false;
          return;
        }
        refreshConsent();
      });

      source.addEventListener('sync', (e: MessageEvent) => {
        retryCount = 0;
        try {
          const payload = JSON.parse(e.data as string) as { unreadCount: number };
          setUnreadCount(payload.unreadCount);
        } catch {
          // ignore malformed event
        }
      });

      source.addEventListener('terms_updated', refreshConsent);

      source.addEventListener('unread_room', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data as string) as { roomID: string; unreadCount: number };
          emitUnreadRoomUpdate(payload);
        } catch {
          // ignore malformed event
        }
      });

      source.addEventListener('notification', (e: MessageEvent) => {
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
          let link = `/notifications/${payload.id}`;
          if (payload.type === 'announcement' && payload.targetID) {
            link = `/announcements/${payload.targetID}`;
          } else if (payload.type === 'dm' && payload.targetType === 'room' && payload.targetID) {
            // DM は通知詳細をスキップして個別 DM ルームへ直行（通知一覧のタップ挙動と揃える）
            link = `/dm/${payload.targetID}`;
          }
          console.log('[SSE] calling addToast:', payload.message, link);
          addToastRef.current(payload.message, 'info', 4000, link);
        } catch (err) {
          console.error('[SSE] failed to parse notification:', err, e.data);
        }
      });

      source.onerror = () => {
        // ネットワーク瞬断（CONNECTING=再接続中）はブラウザに任せ、CLOSED のときだけ自前で復旧する
        if (source.readyState === EventSource.CLOSED) {
          console.warn('[SSE] connection closed, scheduling reconnect');
          scheduleReconnect();
        }
      };
    };

    const scheduleReconnect = () => {
      if (stopped) return;
      closeES();
      clearReconnectTimer();
      // hidden 中は復帰時（visibilitychange）に即再接続するので、無駄なリトライを走らせない
      if (document.visibilityState === 'hidden') return;

      const backoff = Math.min(1000 * 2 ** retryCount, MAX_BACKOFF);
      retryCount += 1;
      reconnectTimer = setTimeout(async () => {
        if (stopped) return;
        // 再接続の前に必ずアクセストークンを更新してから張り直す
        await refreshUserAccessToken();
        if (stopped) return;
        connect();
      }, backoff);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // 復帰時：hidden 猶予タイマーを止め、切れていれば即再接続（バックオフ待ちをスキップ）
        if (hiddenCloseTimer) {
          clearTimeout(hiddenCloseTimer);
          hiddenCloseTimer = null;
        }
        if (!es || es.readyState === EventSource.CLOSED) {
          retryCount = 0;
          clearReconnectTimer();
          reconnectTimer = setTimeout(async () => {
            if (stopped) return;
            await refreshUserAccessToken();
            if (stopped) return;
            connect();
          }, 0);
        }
      } else {
        // hidden：一定時間そのままならサーバースロット解放のため接続を畳む
        if (hiddenCloseTimer) clearTimeout(hiddenCloseTimer);
        hiddenCloseTimer = setTimeout(() => {
          closeES();
          clearReconnectTimer();
        }, HIDDEN_GRACE);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    connect();

    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      clearReconnectTimer();
      if (hiddenCloseTimer) clearTimeout(hiddenCloseTimer);
      closeES();
    };
  }, [token]);

  return (
    <NotificationContext.Provider value={{ unreadCount, lastSseAt, pendingTerms, consentChecking, clearPendingTerms, resetUnread, decrementUnread }}>
      {children}
    </NotificationContext.Provider>
  );
};
