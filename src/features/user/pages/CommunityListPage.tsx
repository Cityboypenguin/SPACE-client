import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { CommunityAvatar } from '../../../components/atoms/CommunityAvatar';
import { listMyCommunities, type Community } from '../api/community';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';
import { UnreadCountBadge } from '../../../components/atoms/UnreadCountBadge';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import styles from './CommunityListPage.module.css';

const LIMIT = 20;

export const CommunityListPage = () => {
  const navigate = useNavigate();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const loadingRef = useRef(false);

  const loadCommunities = useCallback(async (currentOffset: number, isInitial: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (isInitial) setInitialLoading(true);
    else setLoadingMore(true);
    try {
      const result = await listMyCommunities(LIMIT, currentOffset);
      setCommunities(prev => isInitial ? result.items : [...prev, ...result.items]);
      setTotal(result.total);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      loadingRef.current = false;
      if (isInitial) setInitialLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadCommunities(0, true);
  }, [loadCommunities]);

  const sentinelRef = useInfiniteScroll(
    useCallback(() => {
      setCommunities((prev) => {
        if (!loadingRef.current && prev.length < total) loadCommunities(prev.length, false);
        return prev;
      });
    }, [total, loadCommunities]),
    loadingMore,
  );

  useUnreadSubscription(({ roomID, unreadCount }) => {
    setCommunities(prev => prev.map(c => c.roomID === roomID ? { ...c, unreadCount } : c));
  });

  const hasMore = communities.length < total;

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>コミュニティ</h1>
          <div className={styles.headerActions}>
            <button className={styles.btnSecondary} onClick={() => navigate('/community/browse')}>
              コミュニティを探す
            </button>
            <button className={styles.btnPrimary} onClick={() => navigate('/community/create')}>
              + 作成
            </button>
          </div>
        </div>

        {loadError && <p style={{ color: 'red' }}>コミュニティの読み込みに失敗しました</p>}

        {initialLoading ? (
          <p style={{ color: '#94a3b8' }}>読み込み中...</p>
        ) : communities.length === 0 ? (
          <div className={styles.empty}>
            <p>参加しているコミュニティがありません</p>
            <button className={styles.btnPrimaryRound} onClick={() => navigate('/community/browse')}>
              コミュニティを探す
            </button>
          </div>
        ) : (
          <>
            <ul className={styles.list}>
              {communities.map((c) => {
                const hasUnread = (c.unreadCount ?? 0) > 0;
                return (
                  <li
                    key={c.ID}
                    onClick={() => navigate(`/community/chat/${c.roomID}`, { state: { communityID: c.ID } })}
                    className={`${styles.item} ${hasUnread ? styles.itemUnread : ''}`}
                  >
                    <CommunityAvatar name={c.name} src={c.avatarURL} />
                    <div className={styles.itemBody}>
                      <div className={`${styles.itemName} ${hasUnread ? styles.itemNameUnread : ''}`}>{c.name}</div>
                      <div className={styles.itemDescription}>{c.description}</div>
                    </div>
                    {hasUnread ? (
                      <UnreadCountBadge count={c.unreadCount} />
                    ) : (
                      <span className={styles.chevron}>›</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <div ref={sentinelRef} style={{ height: '1px' }} />
            {loadingMore && (
              <p style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>読み込み中...</p>
            )}
            {!hasMore && communities.length > 0 && communities.length >= LIMIT && (
              <p style={{ color: '#94a3b8', padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
                すべてのコミュニティを表示しました
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
};
