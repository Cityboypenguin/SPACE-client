import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { useNotification } from '../context/NotificationContext';
import {
  listMyNotifications,
  markNotificationAsRead,
  type Notification,
} from '../api/notification';

const TYPE_LABEL: Record<string, string> = {
  favorite: 'いいね',
  reply: '返信',
  dm: 'DM',
  community_kick: 'コミュニティからの退出',
  community_role: 'コミュニティ権限変更',
  announcement: 'お知らせ',
};

const TARGET_PATH: Record<string, (id: string) => string> = {
  post: (id) => `/posts/${id}`,
  room: (id) => `/community/chat/${id}`,
  community: (id) => `/community`,
  announcement: (id) => `/announcements/${id}`,
};

const DM_TYPES = new Set(['dm']);

export const NotificationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { decrementUnread } = useNotification();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    listMyNotifications()
      .then((list) => {
        const found = list.find((n) => n.ID === id) ?? null;
        setNotification(found);
        if (found && !found.isRead) {
          return markNotificationAsRead(found.ID).then(() => {
            setNotification((prev) => prev ? { ...prev, isRead: true } : prev);
            decrementUnread();
          });
        }
      })
      .catch(() => setError('通知の読み込みに失敗しました'))
      .finally(() => setLoading(false));
  }, [id, decrementUnread]);

  const handleTargetLink = () => {
    if (!notification?.targetType || !notification?.targetID) return;
    if (DM_TYPES.has(notification.type) && notification.targetType === 'room') {
      navigate(`/dm/${notification.targetID}`);
      return;
    }
    const builder = TARGET_PATH[notification.targetType];
    if (builder) navigate(builder(notification.targetID));
  };

  return (
    <div>
      <UserHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
        <button
          onClick={() => navigate('/notifications')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#3b82f6',
            fontSize: '0.875rem',
            padding: '0.25rem 0',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          ← 通知一覧に戻る
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>読み込み中...</p>
        ) : !notification ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>通知が見つかりません</p>
        ) : (
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 12,
                  background: '#e2e8f0',
                  color: '#475569',
                  fontWeight: 600,
                }}
              >
                {TYPE_LABEL[notification.type] ?? notification.type}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {new Date(notification.createdAt).toLocaleString('ja-JP')}
              </span>
            </div>

            {notification.actor && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
              >
                {notification.actor.avatarUrl ? (
                  <img
                    src={notification.actor.avatarUrl}
                    alt={notification.actor.name}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: '#cbd5e1', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 700, color: '#475569',
                    }}
                  >
                    {notification.actor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                    {notification.actor.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                    @{notification.actor.accountID}
                  </p>
                </div>
              </div>
            )}

            <p style={{ fontSize: '1rem', color: '#1e293b', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              {notification.message}
            </p>

            {notification.targetType && notification.targetID && TARGET_PATH[notification.targetType] && (
              <button
                onClick={handleTargetLink}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 8,
                  border: 'none',
                  background: '#3b82f6',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                {DM_TYPES.has(notification.type) ? 'DMへ' :
                 notification.targetType === 'post' ? '投稿を見る' :
                 notification.targetType === 'room' ? 'チャットルームへ' :
                 notification.targetType === 'announcement' ? 'お知らせを見る' : 'コミュニティへ'}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
