import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserHeader } from '../components/organisms/UserHeader';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { createFavoriteUser, deleteFavoriteUser, getFavoriteUsersByUserID } from '../api/favorite_user';
import { createBlocker, deleteBlocker, getBlockersByUserID } from '../api/block';
import { ScrollablePostsList } from '../components/organisms/ScrollablePostsList';
import { ReportModal } from '../components/organisms/ReportMadal';
import { getPostsByUserID, getFavoritePostsByUserID, createFavorite, deleteFavorite, type Post } from '../api/post';
import { toUserMessage } from '../../../lib/errorMessages';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { getUserPostListCache, saveUserPostListCache } from '../cache/postListCache';
import styles from './UserPublicProfilePage.module.css';

type Tab = 'myposts' | 'favorites';

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

export const UserPublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, loading, error } = useProfile(id);
  const { userId: currentUserId } = useAuth();
  const isMe = currentUserId === id;

  const { data: favoriteUsers, mutate: mutateFavorites } = useSWR(
    currentUserId && !isMe ? ['favorite-users', currentUserId] : null,
    ([, uid]: [string, string]) => getFavoriteUsersByUserID(uid),
  );
  const { data: blockedUsers, mutate: mutateBlocked } = useSWR(
    currentUserId && !isMe ? ['blocked-users', currentUserId] : null,
    ([, uid]: [string, string]) => getBlockersByUserID(uid),
  );

  const isFavorited = favoriteUsers?.some((u) => u.ID === id) ?? false;
  const isBlocked = blockedUsers?.some((u) => u.ID === id) ?? false;

  // ⭕️ タブ状態の管理
  const [currentTab, setCurrentTab] = useState<Tab>('myposts');
  const prevTabRef = useRef<Tab>(currentTab);

  // ⭕️ キャッシュのクリーニング関数（対象ユーザーのIDを基準にする）
  const getCleanPosts = useCallback((tabToCheck: Tab, currentPosts: Post[]) => {
    if (tabToCheck === 'favorites' && id) {
      return currentPosts.filter(p => p.favorites.some(f => f.user.ID === id));
    }
    return currentPosts;
  }, [id]);

  const initialCacheRaw = id ? getUserPostListCache(id, currentTab) : null;
  const initialPosts = initialCacheRaw ? getCleanPosts(currentTab, initialCacheRaw.posts) : [];

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [postsTotal, setPostsTotal] = useState(initialCacheRaw?.total ?? 0);
  const [postsLoading, setPostsLoading] = useState(!initialCacheRaw);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [postsErr, setPostsErr] = useState(false);
  const postsLoadingRef = useRef(false);

  const postsRef = useRef(posts);
  const totalRef = useRef(postsTotal);

  // ⭕️ ウィンドウではなく、リスト要素のスクロール位置を管理するRef
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(initialCacheRaw?.scrollY ?? 0);

  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => { totalRef.current = postsTotal; }, [postsTotal]);

  // マウント時の「リスト内」スクロール復元
  useEffect(() => {
    if (!initialCacheRaw) return;
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = initialCacheRaw.scrollY;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [initialCacheRaw]);

  // アンマウント（画面遷移）時のキャッシュ保存
  useEffect(() => {
    return () => {
      if (id) {
        saveUserPostListCache(id, {
          posts: getCleanPosts(prevTabRef.current, postsRef.current),
          total: totalRef.current,
          offset: postsRef.current.length,
          scrollY: scrollYRef.current,
        }, prevTabRef.current);
      }
    };
  }, [id, getCleanPosts]);

  const loadPosts = useCallback(async (userID: string, currentOffset: number, isInitial: boolean, targetTab: Tab) => {
    if (postsLoadingRef.current) return;
    postsLoadingRef.current = true;
    if (isInitial) setPostsLoading(true);
    else setPostsLoadingMore(true);
    try {
      // ⭕️ タブに応じてAPIを分岐
      const page = targetTab === 'myposts'
        ? await getPostsByUserID(userID, 20, currentOffset)
        : await getFavoritePostsByUserID(userID, 20, currentOffset);
        
      setPosts((prev) => isInitial ? page.items : [...prev, ...page.items]);
      setPostsTotal(page.total);
      setPostsErr(false);
    } catch {
      setPostsErr(true);
    } finally {
      postsLoadingRef.current = false;
      if (isInitial) setPostsLoading(false);
      else setPostsLoadingMore(false);
    }
  }, []);

  // 初回ロード
  useEffect(() => {
    if (initialCacheRaw) return;
    if (id) loadPosts(id, 0, true, currentTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadPosts]);

  // ⭕️ タブ切り替え時の処理（手動キャッシュ制御）
  useEffect(() => {
    if (!id) return;

    if (prevTabRef.current !== currentTab) {
      saveUserPostListCache(id, {
        posts: getCleanPosts(prevTabRef.current, postsRef.current),
        total: totalRef.current,
        offset: postsRef.current.length,
        scrollY: scrollYRef.current,
      }, prevTabRef.current);

      const newCache = getUserPostListCache(id, currentTab);

      if (newCache) {
        const cleanedPosts = getCleanPosts(currentTab, newCache.posts);
        setPosts(cleanedPosts);
        setPostsTotal(newCache.total);
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = newCache.scrollY;
          }
        }, 50);
      } else {
        setPosts([]);
        setPostsTotal(0);
        scrollYRef.current = 0;
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        loadPosts(id, 0, true, currentTab);
      }

      prevTabRef.current = currentTab;
    }
  }, [currentTab, id, loadPosts, getCleanPosts]);

  const postsSentinelRef = useInfiniteScroll(
    useCallback(() => {
      setPosts((prev) => {
        if (!postsLoadingRef.current && prev.length < postsTotal && id) {
          loadPosts(id, prev.length, false, currentTab);
        }
        return prev;
      });
    }, [postsTotal, id, loadPosts, currentTab]),
    postsLoadingMore,
  );

  const [actionLoading, setActionLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // ⭕️ いいね機能（ログインユーザー基準で判定・操作）
  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) {
      await deleteFavorite(postId);
    } else {
      await createFavorite(postId);
    }
    setPosts((prev) => prev.map((p) => {
      if (p.ID !== postId) return p;
      if (isLiked) {
        return { ...p, favorites: p.favorites.filter((f) => f.user.ID !== currentUserId) };
      } else {
        return { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: currentUserId ?? '' } }] };
      }
    }));
  };

  const handleFavoriteToggle = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      if (isFavorited) {
        await deleteFavoriteUser(id);
        mutateFavorites((prev) => prev?.filter((u) => u.ID !== id), { revalidate: false });
      } else {
        await createFavoriteUser(id);
        void mutateFavorites();
      }
    } catch (err) {
      alert(toUserMessage(err, 'お気に入りの操作に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!id) return;
    if (!isBlocked && !window.confirm('本当にこのユーザーをブロックしますか？')) return;

    setActionLoading(true);
    try {
      if (isBlocked) {
        await deleteBlocker(id);
        mutateBlocked((prev) => prev?.filter((u) => u.ID !== id), { revalidate: false });
      } else {
        await createBlocker(id);
        void mutateBlocked();
        if (isFavorited) {
          mutateFavorites((prev) => prev?.filter((u) => u.ID !== id), { revalidate: false });
        }
      }
    } catch (err) {
      alert(toUserMessage(err, 'ブロックの操作に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostClick = (postId: string) => {
    if (id) {
      saveUserPostListCache(id, {
        posts: getCleanPosts(currentTab, postsRef.current),
        total: totalRef.current,
        offset: postsRef.current.length,
        scrollY: scrollYRef.current,
      }, currentTab);
    }
    navigate(`/posts/${postId}`);
  };

  const handleReportUser = () => {
    if (!profile || !id) return;
    setIsReportOpen(true);
  };

  return (
    <div>
      <UserHeader />
      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={() => navigate(-1)}>← 戻る</button>

          {profile && (
            <button
              onClick={handleReportUser}
              style={{
                padding: '0.4rem 1rem',
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fca5a5',
                borderRadius: '20px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fef2f2')}
            >
              ⚠️ このユーザーを通報
            </button>
          )}
        </div>

        <h1>ユーザー詳細</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loading && <p>読み込み中...</p>}
        {profile && (
          <div>
            <div className={styles.profileHeader}>
              <UserAvatar userId={profile.user.ID} name={profile.user.name} avatarUrl={profile.avatarUrl} size={80} />
              <div>
                <h2 className={styles.displayName}>{profile.user.name}</h2>
                <p className={styles.username}>@{profile.user.accountID}</p>
              </div>
            </div>

            {!isMe && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', marginBottom: '16px' }}>
                {!isBlocked && (
                  <button
                    onClick={handleFavoriteToggle}
                    disabled={actionLoading}
                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                  >
                    {isFavorited ? '★ お気に入り解除' : '☆ お気に入り登録'}
                  </button>
                )}

                <button
                  onClick={handleBlockToggle}
                  disabled={actionLoading}
                  style={{ padding: '8px 16px', color: 'red', cursor: 'pointer' }}
                >
                  {isBlocked ? 'ブロック解除' : 'ブロックする'}
                </button>
              </div>
            )}

            <dl className={styles.profileList}>
              <dt className={styles.profileLabel}>自己紹介</dt>
              <dd>{profile.bio || '未設定'}</dd>
            </dl>
            <div style={{ marginTop: '2rem' }}>
              
              {/* ⭕️ タブUIの追加 */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '0.5rem' }}>
                <button 
                  style={TAB_STYLE(currentTab === 'myposts')} 
                  onClick={() => setCurrentTab('myposts')}
                >
                  投稿
                </button>
                <button 
                  style={TAB_STYLE(currentTab === 'favorites')} 
                  onClick={() => setCurrentTab('favorites')}
                >
                  いいねした投稿
                </button>
              </div>

              {/* ⭕️ 独立したスクロールコンテナ */}
              <div 
                ref={scrollContainerRef}
                onScroll={(e) => { scrollYRef.current = e.currentTarget.scrollTop; }}
                style={{ 
                  height: 'calc(100vh - 250px)', 
                  minHeight: '300px',
                  overflowY: 'auto', 
                  overflowX: 'hidden'
                }}
              >
                <ScrollablePostsList
                  posts={posts}
                  loading={postsLoading}
                  loadingMore={postsLoadingMore}
                  error={postsErr}
                  currentUserId={currentUserId} // 自分自身を渡す
                  sentinelRef={postsSentinelRef}
                  onLike={handleLike}
                  onPostClick={handlePostClick}
                />
              </div>

            </div>
          </div>
        )}
      </main>
      {id && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="USER"
          targetID={id}
        />
      )}
    </div>
  );
};