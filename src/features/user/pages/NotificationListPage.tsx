import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { Pagination } from '../components/molecules/Pagination';
import { useNotification } from '../context/NotificationContext';
import {
  listMyNotificationGroups,
  listMyNotifications,
  markAllNotificationsAsRead,
  markAllNotificationsAsReadByActor,
  markNotificationAsRead,
  deleteNotifications,
  deleteReadNotifications,
  deleteReadNotificationsByActor,
  type NotificationActor,
} from '../api/notification';
import { listAnnouncements } from '../api/announcement';
import { toUserMessage } from '../../../lib/errorMessages';
import { storageUrl } from '../../../lib/storage';
import senshuIcon from '../../../assets/Senshu-Universe.svg';
import { Tabs } from '../../../components/molecules/Tabs';
import styles from './NotificationListPage.module.css';
import  mail  from '../../../assets/パーツ_メール.svg';
import favorite from '../../../assets/パーツ_いいね.svg';
import community from '../../../assets/パーツ_コミュニティマーク.svg';
import reply from '../../../assets/パーツ_コメント.svg';
import notification from '../../../assets/パーツ_通知.svg';
import person from '../../../assets/パーツ_お気に入り.svg';

type Tab = 'notifications' | 'announcements';

type ViewingActor = { actor: NotificationActor; type: string };

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

function PersonIcon() {
  return (
    <img src={person} alt="Follow" width="20" height="20" />
  );
}

const TYPE_ICON: Record<string, ReactNode> = {
  favorite: <HeartIcon />,
  reply: <ReplyIcon />,
  dm: <ChatIcon />,
  community_kick: <GroupIcon />,
  community_role: <GroupIcon />,
  announcement: <BellIcon />,
  follow: <PersonIcon />,
};

export const NotificationListPage = () => {
  const navigate = useNavigate();
  const { lastSseAt, unreadCount, decrementUnread } = useNotification();
  const lastSseAtRef = useRef(lastSseAt);

  const [tab, setTab] = useState<Tab>('notifications');
  const [notifError, setNotifError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [notifPage, setNotifPage] = useState(0);
  const [actorPage, setActorPage] = useState(0);
  const [announcePage, setAnnouncePage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [viewingActor, setViewingActor] = useState<ViewingActor | null>(null);

  const { data: groupsData, isLoading: notifLoading, mutate: mutateGroups } = useSWR(
    ['my-notification-groups', notifPage, pageSize],
    () => listMyNotificationGroups(pageSize, notifPage * pageSize),
  );

  const { data: actorData, mutate: mutateActorNotifs } = useSWR(
    viewingActor ? ['my-notifications-actor', viewingActor.type, viewingActor.actor.ID, actorPage, pageSize] : null,
    () => listMyNotifications(pageSize, actorPage * pageSize, viewingActor!.type, viewingActor!.actor.ID),
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
    if (tab === 'notifications') {
      void mutateGroups();
      if (viewingActor) void mutateActorNotifs();
    }
  }, [lastSseAt, tab, viewingActor, mutateGroups, mutateActorNotifs]);

  const pagedGroups = groupsData?.items ?? [];
  const notifTotal = groupsData?.total ?? 0;
  const notifTotalPages = Math.max(1, Math.ceil(notifTotal / pageSize));
  const announceList = announceData?.items ?? [];
  const announceTotal = announceData?.total ?? 0;
  const announceTotalPages = Math.ceil(announceTotal / pageSize);
  const hasUnread = unreadCount > 0;
  const hasRead = pagedGroups.some((g) => g.count > g.unreadCount);
  const allSelected = pagedGroups.length > 0 && pagedGroups.every((g) => selectedIds.has(g.latestID));

  const actorNotifs = actorData?.items ?? [];
  const actorTotal = actorData?.total ?? 0;
  const actorTotalPages = Math.max(1, Math.ceil(actorTotal / pageSize));
  const actorHasUnread = actorNotifs.some((n) => !n.isRead);
  const actorHasRead = actorNotifs.some((n) => n.isRead);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setNotifError('');
    try {
      await markAllNotificationsAsRead();
      mutateGroups(
        (prev) => prev ? { ...prev, items: prev.items.map((g) => ({ ...g, unreadCount: 0 })) } : prev,
        { revalidate: false },
      );
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
      void mutateGroups();
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
      void mutateGroups();
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err) {
      setNotifError(toUserMessage(err, '通知の削除に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setDeleting(false);
    }
  };

  const toggleGroupSelect = (latestID: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(latestID)) next.delete(latestID);
      else next.add(latestID);
      return next;
    });
  };

  const openGroup = (group: (typeof pagedGroups)[number]) => {
    if (group.type === 'dm' && group.actor) {
      setActorPage(0);
      setViewingActor({ actor: group.actor, type: group.type });
      return;
    }
    if (group.unreadCount > 0) {
      markNotificationAsRead(group.latestID).catch(() => {});
      mutateGroups(
        (prev) => prev
          ? { ...prev, items: prev.items.map((g) => g.latestID === group.latestID ? { ...g, unreadCount: 0 } : g) }
          : prev,
        { revalidate: false },
      );
      decrementUnread();
    }
    navigate(`/notifications/${group.latestID}`);
  };

  const handleMarkActorAllRead = async () => {
    if (!viewingActor) return;
    setMarkingAll(true);
    setNotifError('');
    try {
      await markAllNotificationsAsReadByActor(viewingActor.type, viewingActor.actor.ID);
      void mutateActorNotifs();
      void mutateGroups();
    } catch (err) {
      setNotifError(toUserMessage(err, '既読処理に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteActorRead = async () => {
    if (!viewingActor) return;
    if (!window.confirm('この相手の既読済み通知をすべて削除しますか？')) return;
    setDeleting(true);
    setNotifError('');
    try {
      await deleteReadNotificationsByActor(viewingActor.type, viewingActor.actor.ID);
      void mutateActorNotifs();
      void mutateGroups();
    } catch (err) {
      setNotifError(toUserMessage(err, '通知の削除に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setDeleting(false);
    }
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
            {viewingActor ? (
              <>
                <button
                  className={`${styles.headerBtn} ${styles.headerBtnOutline}`}
                  onClick={() => setViewingActor(null)}
                >
                  ← 戻る
                </button>
                <h1 className={styles.pageTitle}>{viewingActor.actor.name}</h1>
              </>
            ) : (
              <h1 className={styles.pageTitle}>通知一覧</h1>
            )}

            {tab === 'notifications' && viewingActor && (
              <div className={styles.headerActions}>
                <button
                  className={`${styles.headerBtn} ${styles.headerBtnOutline}`}
                  onClick={handleMarkActorAllRead}
                  disabled={markingAll || !actorHasUnread}
                >
                  {markingAll ? '処理中...' : '全て既読'}
                </button>
                <button
                  className={`${styles.headerBtn} ${styles.headerBtnOutlineDanger}`}
                  onClick={handleDeleteActorRead}
                  disabled={deleting || !actorHasRead}
                >
                  既読を全削除
                </button>
              </div>
            )}

            {tab === 'notifications' && !viewingActor && pagedGroups.length > 0 && (
              <div className={styles.headerActions}>
                {selectMode ? (
                  <>
                    <button
                      className={`${styles.headerBtn} ${styles.headerBtnOutline}`}
                      onClick={() => {
                        setSelectedIds((prev) => {
                          const ids = pagedGroups.map((g) => g.latestID);
                          if (allSelected) {
                            const next = new Set(prev);
                            ids.forEach((id) => next.delete(id));
                            return next;
                          }
                          return new Set([...prev, ...ids]);
                        });
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

          {!viewingActor && (
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
          )}
        </div>

        {/* ── 通知タブ：個人別詳細 ── */}
        {tab === 'notifications' && viewingActor && (
          <>
            {notifError && <p className={styles.error}>{notifError}</p>}
            {actorNotifs.length === 0 ? (
              <p className={styles.empty}>通知はありません</p>
            ) : (
              <ul className={styles.list}>
                {actorNotifs.map((n) => (
                  <li
                    key={n.ID}
                    className={`${styles.item}${!n.isRead ? ` ${styles.itemUnread}` : ''}`}
                    onClick={() => navigate(`/notifications/${n.ID}`)}
                  >
                    <span className={styles.typeIcon}>
                      {TYPE_ICON[n.type] ?? <BellIcon />}
                    </span>
                    <div className={styles.itemContent}>
                      <p className={styles.itemMessage}>{n.message}</p>
                      <p className={styles.itemDate}>{new Date(n.createdAt).toLocaleString('ja-JP')}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Pagination
              page={actorPage}
              totalPages={actorTotalPages}
              pageSize={pageSize}
              onPageChange={setActorPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}

        {tab === 'notifications' && !viewingActor && (
          <>
            {notifError && <p className={styles.error}>{notifError}</p>}
            {notifLoading ? (
              <p className={styles.loading}>読み込み中...</p>
            ) : pagedGroups.length === 0 ? (
              <p className={styles.empty}>通知はありません</p>
            ) : (
              <ul className={styles.list}>
                {pagedGroups.map((group) => {
                  const isGroupUnread = group.unreadCount > 0;
                  const isGroupSelected = selectedIds.has(group.latestID);
                  const isDmGroup = group.type === 'dm' && !!group.actor;
                  return (
                    <li
                      key={group.key}
                      className={`${styles.item}${isGroupUnread ? ` ${styles.itemUnread}` : ''}${selectMode && isGroupSelected ? ` ${styles.itemSelected}` : ''}`}
                      onClick={() => {
                        if (selectMode) { toggleGroupSelect(group.latestID); return; }
                        openGroup(group);
                      }}
                    >
                      {selectMode && (
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isGroupSelected}
                          onChange={() => toggleGroupSelect(group.latestID)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <span className={styles.typeIcon}>
                        {TYPE_ICON[group.type] ?? <BellIcon />}
                      </span>
                      <div className={styles.itemContent}>
                        {isDmGroup ? (
                          <>
                            <p className={styles.itemMessage}>{group.actor!.name}: {group.message}</p>
                            <p className={styles.itemDate}>{new Date(group.createdAt).toLocaleString('ja-JP')}</p>
                          </>
                        ) : (
                          <>
                            {group.actor && <p className={styles.itemActor}>{group.actor.name}</p>}
                            <p className={styles.itemMessage}>{group.message}</p>
                            {group.targetPost && !group.targetPost.deletedAt && (
                              <div className={styles.targetPostPreview}>
                                {group.targetPost.media.length > 0 && (
                                  <img
                                    src={storageUrl(group.targetPost.media[0].url)}
                                    alt=""
                                    className={styles.targetPostThumb}
                                  />
                                )}
                                <span className={styles.targetPostText}>
                                  {group.targetPost.content || (group.targetPost.media.length > 0 ? '[画像]' : '')}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {group.count > 1 ? (
                        group.unreadCount > 0 && (
                          <span className={styles.countBadge}>{group.unreadCount > 99 ? '99+' : group.unreadCount}</span>
                        )
                      ) : (
                        isGroupUnread && <span className={styles.unreadDot} />
                      )}
                    </li>
                  );
                })}
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
