import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ScrollSentinel } from '../../../components/atoms/ScrollSentinel';
import { Avatar } from '../../../components/atoms/Avatar';
import { UnreadCountBadge } from '../../../components/atoms/UnreadCountBadge';
import { listMyDMRooms, deleteRoom, DELETED_ACCOUNT_ID, type Room } from '../api/message';
import { toUserMessage } from '../../../lib/errorMessages';
import { storageUrl } from '../../../lib/storage';
import { useAuth } from '../context/useAuth';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';
import { useDebouncedRefresh } from '../hooks/useDebouncedRefresh';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { IconSearchBar } from '../components/molecules/IconSearchBar';
import { StatusText } from '../../../components/atoms/StatusText';
import styles from './DMListPage.module.css';
import { AppSwal } from '../../../lib/swal';

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
    void Promise.resolve().then(() => loadDMRooms(0, true));
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

  // 未読数を取り直す。room_changed は「更新された」という事実しか運ばないので、
  // 自分の未読数は一覧クエリ（unreadCount を含む）から取り直すのが素直。
  // 既に読み込んである件数ぶんをまとめて取り直し、無限スクロールで開いた範囲が
  // 1ページ目まで畳まれないようにする。
  const refreshDMRooms = useCallback(() => {
    if (dmLoadingRef.current) return;
    setDmRooms((prev) => {
      if (prev.length === 0) return prev;
      dmLoadingRef.current = true;
      listMyDMRooms(prev.length, 0)
        .then((page) => {
          setDmRooms(page.items);
          setDmTotal(page.total);
        })
        .catch(() => {
          // 取り直しの失敗は表示を壊さない（古い一覧のまま次のイベントを待つ）。
        })
        .finally(() => { dmLoadingRef.current = false; });
      return prev;
    });
  }, []);

  const refreshDMRoomsSoon = useDebouncedRefresh(refreshDMRooms);

  useUnreadSubscription(({ roomID, hasNewMessage, lastMessage }) => {
    // プレビューだけは即座に反映する（サーバが本文から作った文言がイベントに載って
    // いるので、取り直しを待つ必要が無い）。既読による更新（hasNewMessage: false）は
    // 本文が変わったわけではないので触らない。
    if (hasNewMessage && lastMessage !== undefined) {
      setDmRooms((prev) =>
        prev.map((room) => (room.ID === roomID ? { ...room, lastMessage } : room)),
      );
    }
    // 未読数はイベントに載らないので取り直す。賑やかなルームだとイベントが連続する
    // ため、短時間のぶんはまとめて1回にする。
    refreshDMRoomsSoon();
  });

  const handleDeleteRoom = async (e: React.MouseEvent, roomID: string) => {
    e.stopPropagation();
    const result = await AppSwal.fire({
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
          <StatusText style={{ padding: '2rem 0', fontSize: '0.9rem' }}>読み込み中...</StatusText>
        ) : filteredRooms.length === 0 ? (
          <StatusText style={{ padding: '2rem 0', fontSize: '0.9rem' }}>
            {query ? '該当するトークが見つかりませんでした' : 'DMがまだありません'}
          </StatusText>
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
            <ScrollSentinel ref={sentinelRef} />
            {dmLoadingMore && (
              <StatusText style={{ padding: '2rem 0', fontSize: '0.9rem' }}>読み込み中...</StatusText>
            )}
          </ul>
        )}
      </main>
    </div>
  );
};
