import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { CommunityAvatar } from '../../../components/atoms/CommunityAvatar';
import { UnreadCountBadge } from '../../../components/atoms/UnreadCountBadge';
import { listMyCommunities, type Community } from '../api/community';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import searchIconSvg from '../../../assets/パーツ_検索.svg';
import styles from './CommunityListPage.module.css';

const LIMIT = 20;

export const CommunityListPage = () => {
  const [query, setQuery] = useState('');
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

  const filteredCommunities = communities.filter((c) => {
    if (!query) return true;
    return c.name.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.topActions}>
          <button className={styles.btnSecondary} onClick={() => navigate('/community/browse')}>
            コミュニティを探す
          </button>
          <button className={styles.btnPrimary} onClick={() => navigate('/community/create')}>
            + 作成
          </button>
        </div>

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

        {loadError && (
          <p className={styles.errorText}>コミュニティの読み込みに失敗しました。</p>
        )}

        <h2 className={styles.sectionTitle}>参加中のコミュニティ</h2>

        {initialLoading ? (
          <p className={styles.empty}>読み込み中...</p>
        ) : filteredCommunities.length === 0 ? (
          <div className={styles.empty}>
            <p>{query ? '該当するコミュニティが見つかりませんでした' : '参加しているコミュニティがありません'}</p>
            {!query && (
              <button className={styles.btnPrimaryRound} onClick={() => navigate('/community/browse')}>
                コミュニティを探す
              </button>
            )}
          </div>
        ) : (
          <ul className={styles.list}>
            {filteredCommunities.map((c) => {
              const hasUnread = (c.unreadCount ?? 0) > 0;
              return (
                <li
                  key={c.ID}
                  onClick={() => navigate(`/community/chat/${c.roomID}`, { state: { communityID: c.ID } })}
                  className={`${styles.item} ${hasUnread ? styles.itemUnread : ''}`}
                >
                  <div className={styles.avatarWrap}>
                    <CommunityAvatar name={c.name} src={c.avatarURL} size={44} />
                  </div>
                  <div className={styles.itemBody}>
                    <span className={styles.itemName}>{c.name}</span>
                  </div>
                  <div className={styles.itemRight}>
                    {c.description && (
                      <p className={styles.itemDescription}>{c.description}</p>
                    )}
                    <UnreadCountBadge count={c.unreadCount ?? 0} />
                  </div>
                </li>
              );
            })}
            <div ref={sentinelRef} style={{ height: '1px' }} />
            {loadingMore && (
              <p className={styles.empty}>読み込み中...</p>
            )}
          </ul>
        )}
      </main>
    </div>
  );
};
