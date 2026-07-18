import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { useNotification } from '../context/NotificationContext';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import {
  getNotification,
  markNotificationAsRead,
  deleteNotifications,
} from '../api/notification';
import { storageUrl } from '../../../lib/storage';
import { PostMediaGrid } from '../../../components/molecules/PostMediaGrid';
import styles from './NotificationDetailPage.module.css';
import { AppSwal } from '../../../lib/swal';

const TYPE_LABEL: Record<string, string> = {
  favorite: 'いいね',
  reply: '返信',
  dm: 'DM',
  community_kick: 'コミュニティからの退出',
  community_role: 'コミュニティ権限変更',
  announcement: 'お知らせ',
  follow: 'お気に入り',
};

// 過去の通知はDBに旧文言（フォロー表記）のまま保存されているため、
// 表示時に上書きする（対症療法。DBのmessage列は書き換えない）。
const FOLLOW_MESSAGE = 'あなたがお気に入りに登録されました';

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

  const { data: notification, isLoading, mutate } = useSWR(
    id ? ['my-notification-detail', id] : null,
    () => getNotification(id!),
  );

  useEffect(() => {
    if (!notification || notification.isRead) return;
    markNotificationAsRead(notification.ID)
      .then(() => {
        mutate(
          (prev) => prev ? { ...prev, isRead: true } : prev,
          { revalidate: false },
        );
        decrementUnread();
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification?.ID, notification?.isRead]);

  const handleDelete = async () => {
    if (!notification) return;
    const result = await AppSwal.fire({
      text: 'この通知を削除しますか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
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
          <button type="button" onClick={() => navigate(-1)}>
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
              <button
                type="button"
                className={styles.actorRow}
                onClick={() => navigate(`/users/${notification.actor!.ID}`)}
              >
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
                <div className={styles.actorInfo}>
                  <p className={styles.actorName}>{notification.actor.name}</p>
                  <p className={styles.actorAccountID}>@{notification.actor.accountID}</p>
                </div>
              </button>
            )}

            <p className={styles.message}>
              {notification.type === 'follow' ? FOLLOW_MESSAGE : notification.message}
            </p>

            {notification.targetPost && !notification.targetPost.deletedAt && (
              <div className={styles.targetPostPreview}>
                <p className={styles.targetPostAuthor}>{notification.targetPost.user.name}</p>
                {notification.targetPost.content && (
                  <p className={styles.targetPostContent}>{notification.targetPost.content}</p>
                )}
                {notification.targetPost.media.length > 0 && (
                  <div className={styles.targetPostMedia}>
                    <PostMediaGrid media={notification.targetPost.media} />
                  </div>
                )}
              </div>
            )}

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
