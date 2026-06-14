import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { ScrollablePostsList } from '../components/organisms/ScrollablePostsList';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import styles from './UserDashboard.module.css';
import { getPostsByUserID, getFavoritePostsByUserID, createFavorite, deleteFavorite, type Post } from '../api/post';
import { getUserPostListCache, saveUserPostListCache } from '../cache/postListCache';

export type Tab = 'myposts' | 'favorites';

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

export const UserDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [flashMessage, setFlashMessage] = useState('');
  const { userId } = useAuth();
  const { profile, loading, error } = useProfile(userId);

  const [currentTab, setCurrentTab] = useState<Tab>('myposts');
  const prevTabRef = useRef<Tab>(currentTab);

  // ⭕️ 1. キャッシュのクリーニング関数（いいねが外れたものを消去する）
  const getCleanPosts = useCallback((tabToCheck: Tab, currentPosts: Post[]) => {
    if (tabToCheck === 'favorites' && userId) {
      return currentPosts.filter(p => p.favorites.some(f => f.user.ID === userId));
    }
    return currentPosts;
  }, [userId]);

  // マウント時の初回キャッシュ取得（他ページで更新されたデータがここに入ってくる）
  const initialCacheRaw = userId ? getUserPostListCache(userId, currentTab) : null;
  // 初回取得時にもクリーニングを通し、最新の状態を反映させる
  const initialPosts = initialCacheRaw ? getCleanPosts(currentTab, initialCacheRaw.posts) : [];

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [postsTotal, setPostsTotal] = useState(initialCacheRaw?.total ?? 0);
  const [postsLoading, setPostsLoading] = useState(!initialCacheRaw);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [postsErr, setPostsErr] = useState(false);
  const postsLoadingRef = useRef(false);

  const postsRef = useRef(posts);
  const totalRef = useRef(postsTotal);
  
  // ⭕️ 2. ウィンドウスクロールを破棄し、タブ内（div）のスクロールのみを管理
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

  // ⭕️ アンマウント（他画面への遷移）時のキャッシュ保存
  useEffect(() => {
    return () => {
      if (userId) {
        saveUserPostListCache(userId, {
          posts: getCleanPosts(prevTabRef.current, postsRef.current),
          total: totalRef.current,
          offset: postsRef.current.length,
          scrollY: scrollYRef.current,
        }, prevTabRef.current);
      }
    };
  }, [userId, getCleanPosts]);

  const loadPosts = useCallback(async (userID: string, currentOffset: number, isInitial: boolean, targetTab: Tab) => {
    if (postsLoadingRef.current) return;
    postsLoadingRef.current = true;
    if (isInitial) setPostsLoading(true);
    else setPostsLoadingMore(true);
    try {
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

  // 初回ロード（キャッシュがない場合のみAPIを叩く）
  useEffect(() => {
    if (initialCacheRaw) return;
    if (userId) loadPosts(userId, 0, true, currentTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loadPosts]);

  // ⭕️ タブ切り替え時の処理
  useEffect(() => {
    if (!userId) return;

    if (prevTabRef.current !== currentTab) {
      // 1. 移動前のタブのキャッシュを保存
      saveUserPostListCache(userId, {
        posts: getCleanPosts(prevTabRef.current, postsRef.current),
        total: totalRef.current,
        offset: postsRef.current.length,
        scrollY: scrollYRef.current, 
      }, prevTabRef.current);

      // 2. 移動先のタブのキャッシュを展開
      const newCache = getUserPostListCache(userId, currentTab);
      
      if (newCache) {
        // キャッシュが存在すれば、絶対にAPI通信はしない
        const cleanedPosts = getCleanPosts(currentTab, newCache.posts);
        setPosts(cleanedPosts);
        setPostsTotal(newCache.total);
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = newCache.scrollY;
          }
        }, 50);
      } else {
        // キャッシュがない場合のみAPI通信を行う
        setPosts([]);
        setPostsTotal(0);
        scrollYRef.current = 0;
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        loadPosts(userId, 0, true, currentTab);
      }
      
      prevTabRef.current = currentTab;
    }
  }, [currentTab, userId, loadPosts, getCleanPosts]);

  const postsSentinelRef = useInfiniteScroll(
    useCallback(() => {
      setPosts((prev) => {
        if (!postsLoadingRef.current && prev.length < postsTotal && userId) {
          loadPosts(userId, prev.length, false, currentTab);
        }
        return prev;
      });
    }, [postsTotal, userId, loadPosts, currentTab]),
    postsLoadingMore,
  );

  useEffect(() => {
    if (location.state && (location.state as { message?: string }).message) {
      setFlashMessage((location.state as { message: string }).message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // いいねボタンを押した時の処理
  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) {
      await deleteFavorite(postId);
    } else {
      await createFavorite(postId);
    }
    setPosts((prev) => prev.map((p) => {
      if (p.ID !== postId) return p;
      if (isLiked) {
        return { ...p, favorites: p.favorites.filter((f) => f.user.ID !== userId) };
      } else {
        return { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: userId ?? '' } }] };
      }
    }));
  };

  const handlePostClick = (postId: string) => {
    if (userId) {
      saveUserPostListCache(userId, {
        posts: getCleanPosts(currentTab, postsRef.current),
        total: totalRef.current,
        offset: postsRef.current.length,
        scrollY: scrollYRef.current,
      }, currentTab);
    }
    navigate(`/posts/${postId}`);
  };

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <UserHeader />
      <main className={styles.main}>
        {flashMessage && (
          <p style={{ color: 'green', fontWeight: 'bold', marginBottom: '1rem' }}>
            {flashMessage}
          </p>
        )}

        <h1>マイページ</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {profile ? (
          <div>
            <div className={styles.profileHeader}>
              <UserAvatar userId={profile.user.ID} name={profile.user.name} avatarUrl={profile.avatarUrl} size={64} />
              <div>
                <h2 className={styles.displayName}>{profile.user.name}</h2>
                <p className={styles.username}>@{profile.user.accountID}</p>
              </div>
            </div>
            <dl className={styles.profileList}>
              <dt className={styles.profileLabel}>自己紹介</dt>
              <dd>{profile.bio || '未設定'}</dd>
            </dl>
            <p className={styles.accountMeta}>
              アカウントID: {profile.user.accountID} / メールアドレス: {profile.user.email} / ロール: {profile.user.role} / ステータス: {profile.user.status}
            </p>
          </div>
        ) : (
          <p>プロフィールがまだ作成されていません</p>
        )}

        <div className={styles.linkContainer}>
          <Link to="/mypage/profile-edit" className={styles.linkItem}>プロフィール編集</Link>
          <Link to="/mypage/settings" className={styles.linkItem}>アカウント設定</Link>
          <Link to="/mypage/favorites" className={styles.linkItem}>お気に入り一覧</Link>
          <Link to="/mypage/blocks" className={styles.linkItem}>ブロック一覧</Link>
        </div>

        <div style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '0.5rem' }}>
            <button 
              style={TAB_STYLE(currentTab === 'myposts')} 
              onClick={() => setCurrentTab('myposts')}
            >
              自分の投稿
            </button>
            <button 
              style={TAB_STYLE(currentTab === 'favorites')} 
              onClick={() => setCurrentTab('favorites')}
            >
              いいねした投稿
            </button>
          </div>
          
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
              currentUserId={userId}
              sentinelRef={postsSentinelRef}
              onLike={handleLike}
              onPostClick={handlePostClick}
            />
          </div>

        </div>
      </main>
    </div>
  );
};