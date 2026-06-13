import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { Avatar } from '../../../components/atoms/Avatar';
import { UnreadCountBadge } from '../../../components/atoms/UnreadCountBadge';
import { listMyDMRooms, type Room } from '../api/message';
import { storageUrl } from '../../../lib/storage';
import { useAuth } from '../context/AuthContext';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import searchIconSvg from '../../../assets/パーツ_検索.svg';
import styles from './DMListPage.module.css';

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

  useUnreadSubscription(({ roomID, unreadCount }) => {
    setDmRooms((prev) =>
      prev.map((room) => room.ID === roomID ? { ...room, unreadCount } : room),
    );
  });

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
        <div className={styles.searchWrap}>
          <img src={searchIconSvg} alt="" className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {dmError && (
          <p className={styles.errorText}>DMルームの読み込みに失敗しました。</p>
        )}

        <h2 className={styles.sectionTitle}>最近のトーク</h2>

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
