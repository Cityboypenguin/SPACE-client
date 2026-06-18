import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { useNotification } from '../context/NotificationContext';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import {
  listMyNotifications,
  markNotificationAsRead,
  deleteNotifications,
} from '../api/notification';
import { storageUrl } from '../../../lib/storage';
import styles from './NotificationDetailPage.module.css';

const TYPE_LABEL: Record<string, string> = {
  favorite: 'いいね',
  reply: '返信',
  dm: 'DM',
  community_kick: 'コミュニティからの退出',
  community_role: 'コミュニティ権限変更',
  announcement: 'お知らせ',
  follow: 'フォロー',
};

const ACTION_LABEL: Record<string, string> = {
  dm: 'DMへいく',
  favorite: '投稿へいく',
  reply: '投稿へいく',
  community_kick: 'コミュニティへいく',
  community_role: 'コミュニティへいく',
  announcement: 'お知らせへいく',
};

const TARGET_PATH: Record<string, (id: string) => string> = {
  post: (id) => `/posts/${id}`,
  room: (id) => `/community/chat/${id}`,
  community: () => `/community`,
  announcement: (id) => `/announcements/${id}`,
};

const DM_TYPES = new Set(['dm']);

export const NotificationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { decrementUnread } = useNotification();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading, mutate } = useSWR(
    ['my-notifications-detail', id],
    () => listMyNotifications(50, 0),
  );

  const notification = data?.items.find((n) => n.ID === id) ?? null;

  useEffect(() => {
    if (!notification || notification.isRead) return;
    markNotificationAsRead(notification.ID)
      .then(() => {
        mutate(
          (prev) => prev ? { ...prev, items: prev.items.map((n) => n.ID === notification.ID ? { ...n, isRead: true } : n) } : prev,
          { revalidate: false },
        );
        decrementUnread();
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification?.ID, notification?.isRead]);

  const handleDelete = async () => {
    if (!notification) return;
    if (!window.confirm('この通知を削除しますか？')) return;
    setDeleting(true);
    try {
      await deleteNotifications([notification.ID]);
      navigate('/notifications');
    } catch {
      setError('削除に失敗しました');
      setDeleting(false);
    }
  };

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
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft />
          </button>
          {notification && (
            <button className={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
              {deleting ? '削除中...' : '削除'}
            </button>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {isLoading ? (
          <p className={styles.empty}>読み込み中...</p>
        ) : !notification ? (
          <p className={styles.empty}>通知が見つかりません</p>
        ) : (
          <div className={styles.card}>
            <div className={styles.metaRow}>
              <span className={styles.typeBadge}>
                {TYPE_LABEL[notification.type] ?? notification.type}
              </span>
              <span className={styles.date}>
                {new Date(notification.createdAt).toLocaleString('ja-JP')}
              </span>
            </div>

            {notification.actor && (
              <div className={styles.actorRow}>
                {notification.actor.avatarUrl ? (
                  <img
                    src={storageUrl(notification.actor.avatarUrl) ?? undefined}
                    alt={notification.actor.name}
                    className={styles.actorAvatar}
                  />
                ) : (
                  <div className={styles.actorAvatarFallback}>
                    {notification.actor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className={styles.actorName}>{notification.actor.name}</p>
                  <p className={styles.actorAccountID}>@{notification.actor.accountID}</p>
                </div>
              </div>
            )}

            <p className={styles.message}>{notification.message}</p>

            {notification.targetType && notification.targetID && TARGET_PATH[notification.targetType] && (
              <button className={styles.actionBtn} onClick={handleTargetLink}>
                {ACTION_LABEL[notification.type] ?? '詳細へいく'}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
