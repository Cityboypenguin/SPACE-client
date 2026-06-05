import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { useNotification } from '../context/NotificationContext';
import {
  listMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotifications,
  deleteReadNotifications,
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

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteRead = async () => {
    if (!window.confirm('既読済みの通知をすべて削除しますか？')) return;
    setDeleting(true);
    setNotifError('');
    try {
      await deleteReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch {
      setNotifError('削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`選択した${selectedIds.size}件の通知を削除しますか？`)) return;
    setDeleting(true);
    setNotifError('');
    try {
      await deleteNotifications(Array.from(selectedIds));
      const deletedUnreadCount = notifications.filter(
        (n) => selectedIds.has(n.ID) && !n.isRead,
      ).length;
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.ID)));
      for (let i = 0; i < deletedUnreadCount; i++) decrementUnread();
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch {
      setNotifError('削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.ID)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const hasUnread = notifications.some((n) => !n.isRead);
  const hasRead = notifications.some((n) => n.isRead);
  const allSelected = notifications.length > 0 && selectedIds.size === notifications.length;

  return (
    <div>
      <UserHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div
          style={{
            padding: '1rem 1rem 0',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
              通知
            </h1>

            {tab === 'notifications' && notifications.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {selectMode ? (
                  <>
                    <button
                      onClick={toggleSelectAll}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid #94a3b8',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: '#475569',
                        fontWeight: 500,
                      }}
                    >
                      {allSelected ? '全解除' : '全選択'}
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={deleting || selectedIds.size === 0}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 8,
                        border: 'none',
                        background: selectedIds.size === 0 || deleting ? '#fca5a5' : '#ef4444',
                        cursor: selectedIds.size === 0 || deleting ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    >
                      {deleting ? '削除中...' : `削除${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`}
                    </button>
                    <button
                      onClick={exitSelectMode}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid #94a3b8',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: '#475569',
                        fontWeight: 500,
                      }}
                    >
                      キャンセル
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleMarkAllRead}
                      disabled={markingAll || !hasUnread}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid #94a3b8',
                        background: '#fff',
                        cursor: markingAll || !hasUnread ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        color: markingAll || !hasUnread ? '#cbd5e1' : '#475569',
                        fontWeight: 500,
                      }}
                    >
                      {markingAll ? '処理中...' : '全て既読'}
                    </button>
                    <button
                      onClick={handleDeleteRead}
                      disabled={deleting || !hasRead}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid #fca5a5',
                        background: '#fff',
                        cursor: deleting || !hasRead ? 'not-allowed' : 'pointer',
                        fontSize: '0.8rem',
                        color: deleting || !hasRead ? '#fca5a5' : '#ef4444',
                        fontWeight: 500,
                      }}
                    >
                      既読を全削除
                    </button>
                    <button
                      onClick={() => setSelectMode(true)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 8,
                        border: '1px solid #94a3b8',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: '#475569',
                        fontWeight: 500,
                      }}
                    >
                      選択
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
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
                      if (selectMode) {
                        toggleSelect(n.ID);
                        return;
                      }
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
                      background: selectMode && selectedIds.has(n.ID)
                        ? '#dbeafe'
                        : n.isRead ? '#fff' : '#eff6ff',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                    }}
                  >
                    {selectMode ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(n.ID)}
                        onChange={() => toggleSelect(n.ID)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginTop: '0.3rem', flexShrink: 0, width: 16, height: 16, cursor: 'pointer' }}
                      />
                    ) : (
                      <>
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
                      </>
                    )}
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
