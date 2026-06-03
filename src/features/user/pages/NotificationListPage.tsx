import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { useNotification } from '../context/NotificationContext';
import {
  listMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
} from '../api/notification';
import { listAnnouncements, type Announcement } from '../api/announcement';

type Tab = 'notifications' | 'announcements';

const TYPE_LABEL: Record<string, string> = {
  favorite: 'いいね',
  reply: '返信',
  dm: 'DM',
  community_kick: 'コミュニティからの退出',
  community_role: 'コミュニティ権限変更',
  announcement: 'お知らせ',
};

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '0.75rem 0',
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
  cursor: 'pointer',
  fontWeight: active ? 700 : 400,
  color: active ? '#3b82f6' : '#64748b',
  fontSize: '0.95rem',
  transition: 'color 0.15s, border-color 0.15s',
});

export const NotificationListPage = () => {
  const navigate = useNavigate();
  const { lastSseAt, resetUnread, decrementUnread } = useNotification();
  const lastSseAtRef = useRef(lastSseAt);

  const [tab, setTab] = useState<Tab>('notifications');

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoaded, setAnnouncementsLoaded] = useState(false);
  const [announceLoading, setAnnounceLoading] = useState(false);
  const [announceError, setAnnounceError] = useState('');

  const loadNotifications = () => {
    setNotifLoading(true);
    listMyNotifications(50)
      .then(setNotifications)
      .catch(() => setNotifError('通知の読み込みに失敗しました'))
      .finally(() => setNotifLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (lastSseAt === 0 || lastSseAt === lastSseAtRef.current) return;
    lastSseAtRef.current = lastSseAt;
    if (tab === 'notifications') loadNotifications();
  }, [lastSseAt, tab]);

  const handleTabChange = (next: Tab) => {
    setTab(next);
    if (next === 'announcements' && !announcementsLoaded) {
      setAnnounceLoading(true);
      listAnnouncements(50)
        .then((data) => {
          setAnnouncements(data);
          setAnnouncementsLoaded(true);
        })
        .catch(() => setAnnounceError('お知らせの読み込みに失敗しました'))
        .finally(() => setAnnounceLoading(false));
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetUnread();
    } catch {
      setNotifError('既読処理に失敗しました');
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
            padding: '1rem 1rem 0',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
            通知
          </h1>
          {tab === 'notifications' && notifications.length > 0 && (
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
                marginBottom: '0.75rem',
              }}
            >
              {markingAll ? '処理中...' : '全て既読にする'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          <button style={TAB_STYLE(tab === 'notifications')} onClick={() => handleTabChange('notifications')}>
            通知
          </button>
          <button style={TAB_STYLE(tab === 'announcements')} onClick={() => handleTabChange('announcements')}>
            お知らせ
          </button>
        </div>

        {tab === 'notifications' && (
          <>
            {notifError && <p style={{ color: 'red', padding: '1rem' }}>{notifError}</p>}
            {notifLoading ? (
              <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
            ) : notifications.length === 0 ? (
              <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>通知はありません</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {notifications.map((n) => (
                  <li
                    key={n.ID}
                    onClick={() => {
                      if (n.type === 'announcement' && n.targetID) {
                        if (!n.isRead) {
                          markNotificationAsRead(n.ID).catch(() => {});
                          decrementUnread();
                        }
                        navigate(`/announcements/${n.targetID}`);
                      } else {
                        navigate(`/notifications/${n.ID}`);
                      }
                    }}
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
          </>
        )}

        {tab === 'announcements' && (
          <>
            {announceError && <p style={{ color: 'red', padding: '1rem' }}>{announceError}</p>}
            {announceLoading ? (
              <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
            ) : announcements.length === 0 ? (
              <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>お知らせはありません</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {announcements.map((a) => (
                  <li
                    key={a.ID}
                    onClick={() => navigate(`/announcements/${a.ID}`)}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.1rem 0.5rem',
                          borderRadius: 12,
                          background: '#fef3c7',
                          color: '#92400e',
                          fontWeight: 500,
                        }}
                      >
                        運営からのお知らせ
                      </span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                      {a.title}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(a.createdAt).toLocaleString('ja-JP')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
};
