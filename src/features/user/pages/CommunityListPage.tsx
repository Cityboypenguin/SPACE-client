import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ScrollSentinel } from '../../../components/atoms/ScrollSentinel';
import { CommunityAvatar } from '../../../components/atoms/CommunityAvatar';
import { UnreadCountBadge } from '../../../components/atoms/UnreadCountBadge';
import { listMyCommunities, type Community } from '../api/community';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';
import { useDebouncedRefresh } from '../hooks/useDebouncedRefresh';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { IconSearchBar } from '../components/molecules/IconSearchBar';
import { sortUnreadFirst } from '../lib/unreadSort';
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
    void Promise.resolve().then(() => loadCommunities(0, true));
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

  // 未読数を取り直す。room_changed は「更新された」という事実しか運ばないので、
  // 自分の未読数は一覧クエリ（unreadCount を含む）から取り直すのが素直。
  // 既に読み込んである件数ぶんをまとめて取り直し、無限スクロールで開いた範囲が
  // 1ページ目まで畳まれないようにする。
  const refreshCommunities = useCallback(() => {
    if (loadingRef.current) return;
    setCommunities((prev) => {
      if (prev.length === 0) return prev;
      loadingRef.current = true;
      listMyCommunities(prev.length, 0)
        .then((result) => {
          setCommunities(result.items);
          setTotal(result.total);
        })
        .catch(() => {
          // 取り直しの失敗は表示を壊さない（古い一覧のまま次のイベントを待つ）。
        })
        .finally(() => { loadingRef.current = false; });
      return prev;
    });
  }, []);

  const refreshCommunitiesSoon = useDebouncedRefresh(refreshCommunities);

  useUnreadSubscription(({ roomID, hasNewMessage, lastMessage }) => {
    // プレビューだけは即座に反映する（サーバが本文から作った文言がイベントに載って
    // いるので、取り直しを待つ必要が無い）。既読による更新（hasNewMessage: false）は
    // 本文が変わったわけではないので触らない。
    if (hasNewMessage && lastMessage !== undefined) {
      setCommunities(prev => prev.map(c => (c.roomID === roomID ? { ...c, lastMessage } : c)));
    }
    // 未読数はイベントに載らないので取り直す。賑やかなルームだとイベントが連続する
    // ため、短時間のぶんはまとめて1回にする。
    refreshCommunitiesSoon();
  });

  const filteredCommunities = communities.filter((c) => {
    if (!query) return true;
    return c.name.toLowerCase().includes(query.toLowerCase());
  });
  const visibleCommunities = sortUnreadFirst(filteredCommunities);

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.topActions}>
          <button className={styles.btnSecondary} onClick={() => navigate('/community/browse')}>
            コミュニティを探す
          </button>
        </div>

        <IconSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search"
        />

        {loadError && (
          <p className={styles.errorText}>コミュニティの読み込みに失敗しました。</p>
        )}

        <h2 className={styles.sectionTitle}>参加中のコミュニティ</h2>

        {initialLoading ? (
          <p className={styles.empty}>読み込み中...</p>
        ) : visibleCommunities.length === 0 ? (
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
            {visibleCommunities.map((c) => {
              const hasUnread = (c.unreadCount ?? 0) > 0;
              return (
                <li
                  key={c.ID}
                  onClick={() => navigate(`/community/chat/${c.roomID}`, { state: { communityID: c.ID, community: c } })}
                  className={`${styles.item} ${hasUnread ? styles.itemUnread : ''}`}
                >
                  <div className={styles.avatarWrap}>
                    <CommunityAvatar name={c.name} src={c.avatarURL} size={44} />
                  </div>
                  <div className={styles.itemBody}>
                    <span className={styles.itemName}>{c.name}</span>
                  </div>
                  <div className={styles.itemRight}>
                    {c.lastMessage && (
                      <p className={styles.itemDescription}>{c.lastMessage}</p>
                    )}
                    <UnreadCountBadge count={c.unreadCount ?? 0} />
                  </div>
                </li>
              );
            })}
            <ScrollSentinel ref={sentinelRef} />
            {loadingMore && (
              <p className={styles.empty}>読み込み中...</p>
            )}
          </ul>
        )}
      </main>
    </div>
  );
};
