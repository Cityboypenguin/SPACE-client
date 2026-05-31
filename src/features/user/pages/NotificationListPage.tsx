import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { useNotification } from '../context/NotificationContext';
import {
  listMyNotifications,
  markAllNotificationsAsRead,
  type Notification,
} from '../api/notification';

const TYPE_LABEL: Record<string, string> = {
  favorite: 'いいね',
  reply: '返信',
  dm: 'DM',
  community_kick: 'コミュニティからの退出',
  community_role: 'コミュニティ権限変更',
};

export const NotificationListPage = () => {
  const navigate = useNavigate();
  const { lastSseAt, resetUnread } = useNotification();
  const lastSseAtRef = useRef(lastSseAt);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const load = () => {
    setLoading(true);
    listMyNotifications(50)
      .then(setNotifications)
      .catch(() => setError('通知の読み込みに失敗しました'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    resetUnread();
  }, [resetUnread]);

  // SSE で新しい通知が届いたら自動リフレッシュ
  useEffect(() => {
    if (lastSseAt === 0 || lastSseAt === lastSseAtRef.current) return;
    lastSseAtRef.current = lastSseAt;
    load();
  }, [lastSseAt]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetUnread();
    } catch {
      setError('既読処理に失敗しました');
    } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div>
      <UserHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
            通知
          </h1>
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll || !hasUnread}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: 8,
                border: '1px solid #94a3b8',
                background: '#fff',
                cursor: markingAll || !hasUnread ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                color: markingAll || !hasUnread ? '#cbd5e1' : '#475569',
                fontWeight: 500,
              }}
            >
              {markingAll ? '処理中...' : '全て既読にする'}
            </button>
          )}
        </div>

        {error && <p style={{ color: 'red', padding: '1rem' }}>{error}</p>}

        {loading ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
        ) : notifications.length === 0 ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>通知はありません</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {notifications.map((n) => (
              <li
                key={n.ID}
                onClick={() => navigate(`/notifications/${n.ID}`)}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  background: n.isRead ? '#fff' : '#eff6ff',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                {!n.isRead && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#3b82f6',
                      flexShrink: 0,
                      marginTop: '0.4rem',
                    }}
                  />
                )}
                {n.isRead && <span style={{ width: 8, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.1rem 0.5rem',
                        borderRadius: 12,
                        background: '#e2e8f0',
                        color: '#475569',
                        fontWeight: 500,
                      }}
                    >
                      {TYPE_LABEL[n.type] ?? n.type}
                    </span>
                    {n.actor && (
                      <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>
                        {n.actor.name}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b' }}>{n.message}</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {new Date(n.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};
