import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { Avatar } from '../../../components/atoms/Avatar';
import { UnreadCountBadge } from '../../../components/atoms/UnreadCountBadge';
import { listMyDMRooms, deleteRoom, DELETED_ACCOUNT_ID, type Room } from '../api/message';
import { toUserMessage } from '../../../lib/errorMessages';
import { storageUrl } from '../../../lib/storage';
import { useAuth } from '../context/AuthContext';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { IconSearchBar } from '../components/molecules/IconSearchBar';
import styles from './DMListPage.module.css';
import swal from 'sweetalert2';

const LIMIT = 20;

export const DMListPage = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { userId: currentUserID } = useAuth();

  const [dmRooms, setDmRooms] = useState<Room[]>([]);
  const [dmTotal, setDmTotal] = useState(0);
  const [dmInitialLoading, setDmInitialLoading] = useState(true);
  const [dmLoadingMore, setDmLoadingMore] = useState(false);
  const [dmError, setDmError] = useState(false);
  const [deletingRoomID, setDeletingRoomID] = useState<string | null>(null);
  const dmLoadingRef = useRef(false);

  const loadDMRooms = useCallback(async (currentOffset: number, isInitial: boolean) => {
    if (dmLoadingRef.current) return;
    dmLoadingRef.current = true;
    if (isInitial) setDmInitialLoading(true);
    else setDmLoadingMore(true);
    try {
      const page = await listMyDMRooms(LIMIT, currentOffset);
      setDmRooms((prev) => isInitial ? page.items : [...prev, ...page.items]);
      setDmTotal(page.total);
      setDmError(false);
    } catch {
      setDmError(true);
    } finally {
      dmLoadingRef.current = false;
      if (isInitial) setDmInitialLoading(false);
      else setDmLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadDMRooms(0, true);
  }, [loadDMRooms]);

  const sentinelRef = useInfiniteScroll(
    useCallback(() => {
      setDmRooms((prev) => {
        if (!dmLoadingRef.current && prev.length < dmTotal) loadDMRooms(prev.length, false);
        return prev;
      });
    }, [dmTotal, loadDMRooms]),
    dmLoadingMore,
  );

  useUnreadSubscription(({ roomID, unreadCount, lastMessage }) => {
    setDmRooms((prev) =>
      prev.map((room) => room.ID === roomID
        ? { ...room, unreadCount, ...(lastMessage !== undefined ? { lastMessage } : {}) }
        : room),
    );
  });

  const handleDeleteRoom = async (e: React.MouseEvent, roomID: string) => {
    e.stopPropagation();
    const result = await swal.fire({
      text: 'このトークルームを削除しますか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    setDeletingRoomID(roomID);
    try {
      await deleteRoom(roomID);
      setDmRooms((prev) => prev.filter((room) => room.ID !== roomID));
      setDmTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(toUserMessage(err, 'トークルームの削除に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setDeletingRoomID(null);
    }
  };

  const filteredRooms = dmRooms.filter((room) => {
    if (!query) return true;
    const partner = room.user.find((u) => u.ID !== currentUserID) ?? room.user[0];
    if (!partner) return false;
    const q = query.toLowerCase();
    return (
      partner.name.toLowerCase().includes(q) ||
      partner.accountID.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <IconSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search"
        />

        {dmError && (
          <p className={styles.errorText}>DMルームの読み込みに失敗しました。</p>
        )}

        <h2 className={styles.sectionTitle}>DM</h2>

        {dmInitialLoading ? (
          <p className={styles.empty}>読み込み中...</p>
        ) : filteredRooms.length === 0 ? (
          <p className={styles.empty}>
            {query ? '該当するトークが見つかりませんでした' : 'DMがまだありません'}
          </p>
        ) : (
          <ul className={styles.dmList}>
            {filteredRooms.map((room) => {
              const partner = room.user.find((u) => u.ID !== currentUserID) ?? room.user[0];
              if (!partner) return null;
              const hasUnread = (room.unreadCount ?? 0) > 0;
              return (
                <li
                  key={room.ID}
                  onClick={() => navigate(`/dm/${room.ID}`)}
                  className={`${styles.dmItem} ${hasUnread ? styles.dmItemUnread : ''}`}
                >
                  <div className={styles.avatarWrap}>
                    {partner.avatarUrl ? (
                      <img
                        src={storageUrl(partner.avatarUrl) ?? undefined}
                        alt={partner.name}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <Avatar name={partner.name} size={44} />
                    )}
                  </div>
                  <div className={styles.dmItemBody}>
                    <div className={styles.dmItemTop}>
                      <span className={styles.partnerName}>{partner.name}</span>
                      <span className={styles.partnerAccount}>@{partner.accountID}</span>
                    </div>
                  </div>
                  <div className={styles.dmItemRight}>
                    {room.lastMessage && (
                      <p className={styles.lastMessage}>{room.lastMessage}</p>
                    )}
                    <UnreadCountBadge count={room.unreadCount ?? 0} />
                    {partner.accountID === DELETED_ACCOUNT_ID && (
                      <button
                        type="button"
                        className={styles.deleteRoomButton}
                        disabled={deletingRoomID === room.ID}
                        onClick={(e) => handleDeleteRoom(e, room.ID)}
                      >
                        削除
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
            <div ref={sentinelRef} style={{ height: '1px' }} />
            {dmLoadingMore && (
              <p className={styles.empty}>読み込み中...</p>
            )}
          </ul>
        )}
      </main>
    </div>
  );
};
