import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { Pagination } from '../components/molecules/Pagination';
import { useNotification } from '../context/NotificationContext';
import {
  listMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotifications,
  deleteReadNotifications,
  type Notification,
} from '../api/notification';
import { listAnnouncements } from '../api/announcement';
import { toUserMessage } from '../../../lib/errorMessages';
import senshuIcon from '../../../assets/Senshu-Universe.svg';
import { Tabs } from '../../../components/molecules/Tabs';
import styles from './NotificationListPage.module.css';
import  mail  from '../../../assets/パーツ_メール.svg';
import favorite from '../../../assets/パーツ_いいね.svg';
import community from '../../../assets/パーツ_コミュニティマーク.svg';
import reply from '../../../assets/パーツ_コメント.svg';
import notification from '../../../assets/パーツ_通知.svg';

type Tab = 'notifications' | 'announcements';

function HeartIcon() {
  return (
    <img src={favorite} alt="Favorite" width="20" height="20" />
  );
}

function ChatIcon() {
  return (
    <img src={mail} alt="Mail" width="20" height="20" />
  );
}

function ReplyIcon() {
  return (
    <img src={reply} alt="Reply" width="20" height="20" />
  );
}

function GroupIcon() {
  return (
    <img src={community} alt="Community" width="20" height="20" />
  );
}

function BellIcon() {
  return (
    <img src={notification} alt="Notification" width="20" height="20" />
  );
}

const TYPE_ICON: Record<string, ReactNode> = {
  favorite: <HeartIcon />,
  reply: <ReplyIcon />,
  dm: <ChatIcon />,
  community_kick: <GroupIcon />,
  community_role: <GroupIcon />,
  announcement: <BellIcon />,
};

export const NotificationListPage = () => {
  const navigate = useNavigate();
  const { lastSseAt, resetUnread, decrementUnread } = useNotification();
  const lastSseAtRef = useRef(lastSseAt);

  const [tab, setTab] = useState<Tab>('notifications');
  const [notifError, setNotifError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [notifPage, setNotifPage] = useState(0);
  const [announcePage, setAnnouncePage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data: notifData, isLoading: notifLoading, mutate: mutateNotifications } = useSWR(
    ['my-notifications', notifPage, pageSize],
    () => listMyNotifications(pageSize, notifPage * pageSize),
  );

  const { data: announceData, isLoading: announceLoading } = useSWR(
    tab === 'announcements' ? ['announcements', announcePage, pageSize] : null,
    () => listAnnouncements(pageSize, announcePage * pageSize),
  );

  useEffect(() => {
    setNotifPage(0);
    setAnnouncePage(0);
    setSelectMode(false);
    setSelectedIds(new Set());
  }, [pageSize]);

  useEffect(() => {
    if (lastSseAt === 0 || lastSseAt === lastSseAtRef.current) return;
    lastSseAtRef.current = lastSseAt;
    if (tab === 'notifications') void mutateNotifications();
  }, [lastSseAt, tab, mutateNotifications]);

  const notifList: Notification[] = notifData?.items ?? [];
  const notifTotal = notifData?.total ?? 0;
  const notifTotalPages = Math.ceil(notifTotal / pageSize);
  const announceList = announceData?.items ?? [];
  const announceTotal = announceData?.total ?? 0;
  const announceTotalPages = Math.ceil(announceTotal / pageSize);
  const hasUnread = notifList.some((n) => !n.isRead);
  const hasRead = notifList.some((n) => n.isRead);
  const allSelected = notifList.length > 0 && selectedIds.size === notifList.length;

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setNotifError('');
    try {
      await markAllNotificationsAsRead();
      mutateNotifications(
        (prev) => prev ? { ...prev, items: prev.items.map((n) => ({ ...n, isRead: true })) } : prev,
        { revalidate: false },
      );
      resetUnread();
    } catch (err) {
      setNotifError(toUserMessage(err, '既読処理に失敗しました。時間をおいてから再度お試しください。'));
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
      mutateNotifications(
        (prev) => prev ? { ...prev, items: prev.items.filter((n) => !n.isRead) } : prev,
        { revalidate: false },
      );
    } catch (err) {
      setNotifError(toUserMessage(err, '通知の削除に失敗しました。時間をおいてから再度お試しください。'));
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
      const deletedUnreadCount = notifList.filter((n) => selectedIds.has(n.ID) && !n.isRead).length;
      mutateNotifications(
        (prev) => prev ? { ...prev, items: prev.items.filter((n) => !selectedIds.has(n.ID)) } : prev,
        { revalidate: false },
      );
      for (let i = 0; i < deletedUnreadCount; i++) decrementUnread();
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err) {
      setNotifError(toUserMessage(err, '通知の削除に失敗しました。時間をおいてから再度お試しください。'));
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

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <h1 className={styles.pageTitle}>通知一覧</h1>

            {tab === 'notifications' && notifList.length > 0 && (
              <div className={styles.headerActions}>
                {selectMode ? (
                  <>
                    <button
                      className={`${styles.headerBtn} ${styles.headerBtnOutline}`}
                      onClick={() => {
                        if (selectedIds.size === notifList.length) setSelectedIds(new Set());
                        else setSelectedIds(new Set(notifList.map((n) => n.ID)));
                      }}
                    >
                      {allSelected ? '全解除' : '全選択'}
                    </button>
                    <button
                      className={`${styles.headerBtn} ${styles.headerBtnDanger}`}
                      onClick={handleDeleteSelected}
                      disabled={deleting || selectedIds.size === 0}
                    >
                      {deleting ? '削除中...' : `削除${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`}
                    </button>
                    <button className={`${styles.headerBtn} ${styles.headerBtnOutline}`} onClick={exitSelectMode}>
                      キャンセル
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`${styles.headerBtn} ${styles.headerBtnOutline}`}
                      onClick={handleMarkAllRead}
                      disabled={markingAll || !hasUnread}
                    >
                      {markingAll ? '処理中...' : '全て既読'}
                    </button>
                    <button
                      className={`${styles.headerBtn} ${styles.headerBtnOutlineDanger}`}
                      onClick={handleDeleteRead}
                      disabled={deleting || !hasRead}
                    >
                      既読を全削除
                    </button>
                    <button
                      className={`${styles.headerBtn} ${styles.headerBtnOutline}`}
                      onClick={() => setSelectMode(true)}
                    >
                      選択
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <Tabs
            tabs={[
              { key: 'notifications', label: '通知' },
              { key: 'announcements', label: 'お知らせ' },
            ]}
            activeTab={tab}
            onChange={(key) => {
              setTab(key);
              if (key === 'notifications') {
                setNotifPage(0);
                setSelectMode(false);
                setSelectedIds(new Set());
              } else {
                setAnnouncePage(0);
              }
            }}
          />
        </div>

        {/* ── 通知タブ ── */}
        {tab === 'notifications' && (
          <>
            {notifError && <p className={styles.error}>{notifError}</p>}
            {notifLoading ? (
              <p className={styles.loading}>読み込み中...</p>
            ) : notifList.length === 0 ? (
              <p className={styles.empty}>通知はありません</p>
            ) : (
              <ul className={styles.list}>
                {notifList.map((n) => (
                  <li
                    key={n.ID}
                    className={`${styles.item}${!n.isRead ? ` ${styles.itemUnread}` : ''}${selectMode && selectedIds.has(n.ID) ? ` ${styles.itemSelected}` : ''}`}
                    onClick={() => {
                      if (selectMode) { toggleSelect(n.ID); return; }
                      if (!n.isRead) {
                        markNotificationAsRead(n.ID).catch(() => {});
                        decrementUnread();
                        mutateNotifications(
                          (prev) => prev ? { ...prev, items: prev.items.map((item) => item.ID === n.ID ? { ...item, isRead: true } : item) } : prev,
                          { revalidate: false },
                        );
                      }
                      navigate(`/notifications/${n.ID}`);
                    }}
                  >
                    {selectMode && (
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selectedIds.has(n.ID)}
                        onChange={() => toggleSelect(n.ID)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <span className={styles.typeIcon}>
                      {TYPE_ICON[n.type] ?? <BellIcon />}
                    </span>
                    <div className={styles.itemContent}>
                      {n.actor && <p className={styles.itemActor}>{n.actor.name}</p>}
                      <p className={styles.itemMessage}>{n.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Pagination
              page={notifPage}
              totalPages={notifTotalPages}
              pageSize={pageSize}
              onPageChange={(p) => { setNotifPage(p); setSelectMode(false); setSelectedIds(new Set()); }}
              onPageSizeChange={setPageSize}
            />
          </>
        )}

        {/* ── お知らせタブ ── */}
        {tab === 'announcements' && (
          <>
            {announceLoading ? (
              <p className={styles.loading}>読み込み中...</p>
            ) : announceList.length === 0 ? (
              <p className={styles.empty}>お知らせはありません</p>
            ) : (
              <ul className={styles.list}>
                {announceList.map((a) => (
                  <li
                    key={a.ID}
                    className={styles.item}
                    onClick={() => navigate(`/announcements/${a.ID}`)}
                  >
                    <span className={styles.typeIcon}>
                      <img src={senshuIcon} alt="" className={styles.senshuIcon} />
                    </span>
                    <div className={styles.itemContent}>
                      <p className={styles.itemMessage}>{a.title}</p>
                      <p className={styles.itemDate}>{new Date(a.createdAt).toLocaleDateString('ja-JP')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Pagination
              page={announcePage}
              totalPages={announceTotalPages}
              pageSize={pageSize}
              onPageChange={setAnnouncePage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </main>
    </div>
  );
};

