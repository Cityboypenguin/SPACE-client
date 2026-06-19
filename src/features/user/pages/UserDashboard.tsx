import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ProfileCard } from '../components/organisms/ProfileCard';
import { PostCard } from '../components/organisms/PostCard';
import { Tabs } from '../../../components/molecules/Tabs';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import {
  getPostsByUserID,
  getFavoritePostsByUserID,
  createFavorite,
  deleteFavorite,
  type Post,
} from '../api/post';
import { getUserPostListCache, saveUserPostListCache } from '../cache/postListCache';
import styles from './UserDashboard.module.css';

const LIMIT = 20;

export const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  const { profile, loading: profileLoading } = useProfile(userId);
  const [activeTab, setActiveTab] = useState<'own' | 'liked'>('own');
  const [flashMessage, setFlashMessage] = useState('');

  // ── Own posts ────────────────────────────────────────────────────────────
  const initialCacheRef = useRef(userId ? getUserPostListCache(userId) : null);
  const initialCache = initialCacheRef.current;

  const [ownPosts, setOwnPosts] = useState<Post[]>(initialCache?.posts ?? []);
  const [ownTotal, setOwnTotal] = useState(initialCache?.total ?? 0);
  const [ownLoading, setOwnLoading] = useState(!initialCache);
  const [ownLoadingMore, setOwnLoadingMore] = useState(false);
  const ownLoadingRef = useRef(false);
  const ownPostsRef = useRef(ownPosts);
  const ownTotalRef = useRef(ownTotal);
  useEffect(() => { ownPostsRef.current = ownPosts; }, [ownPosts]);
  useEffect(() => { ownTotalRef.current = ownTotal; }, [ownTotal]);

  // ── Liked posts ──────────────────────────────────────────────────────────
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [likedTotal, setLikedTotal] = useState(0);
  const [likedLoading, setLikedLoading] = useState(false);
  const [likedLoadingMore, setLikedLoadingMore] = useState(false);
  const likedLoadingRef = useRef(false);
  const likedLoadedRef = useRef(false);
  const likedPostsRef = useRef(likedPosts);
  const likedTotalRef = useRef(likedTotal);
  useEffect(() => { likedPostsRef.current = likedPosts; }, [likedPosts]);
  useEffect(() => { likedTotalRef.current = likedTotal; }, [likedTotal]);

  // ── Scroll tracking ───────────────────────────────────────────────────────
  const scrollYRef = useRef(initialCache?.scrollY ?? 0);
  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    if (!initialCache) return;
    window.scrollTo(0, initialCache.scrollY);
  }, [initialCache]);

  useEffect(() => {
    return () => {
      if (userId) {
        saveUserPostListCache(userId, {
          posts: ownPostsRef.current,
          total: ownTotalRef.current,
          offset: ownPostsRef.current.length,
          scrollY: scrollYRef.current,
        });
      }
    };
  }, [userId]);

  // ── Flash message ────────────────────────────────────────────────────────
  useEffect(() => {
    if (location.state && (location.state as { message?: string }).message) {
      setFlashMessage((location.state as { message: string }).message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // ── Load own posts ────────────────────────────────────────────────────────
  const loadOwnPosts = useCallback(async (userID: string, offset: number, isInitial: boolean) => {
    if (ownLoadingRef.current) return;
    ownLoadingRef.current = true;
    if (isInitial) setOwnLoading(true);
    else setOwnLoadingMore(true);
    try {
      const page = await getPostsByUserID(userID, LIMIT, offset);
      setOwnPosts(prev => {
        if (isInitial) return page.items;
        const ids = new Set(prev.map(p => p.ID));
        return [...prev, ...page.items.filter(p => !ids.has(p.ID))];
      });
      setOwnTotal(page.total);
    } catch { /* noop */ } finally {
      ownLoadingRef.current = false;
      if (isInitial) setOwnLoading(false);
      else setOwnLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (initialCache) return;
    if (userId) loadOwnPosts(userId, 0, true);
  }, [userId, loadOwnPosts, initialCache]);

  // ── Load liked posts ──────────────────────────────────────────────────────
  const loadLikedPosts = useCallback(async (userID: string, offset: number, isInitial: boolean) => {
    if (likedLoadingRef.current) return;
    likedLoadingRef.current = true;
    if (isInitial) setLikedLoading(true);
    else setLikedLoadingMore(true);
    try {
      const page = await getFavoritePostsByUserID(userID, LIMIT, offset);
      setLikedPosts(prev => {
        if (isInitial) return page.items;
        const ids = new Set(prev.map(p => p.ID));
        return [...prev, ...page.items.filter(p => !ids.has(p.ID))];
      });
      setLikedTotal(page.total);
      likedLoadedRef.current = true;
    } catch { /* noop */ } finally {
      likedLoadingRef.current = false;
      if (isInitial) setLikedLoading(false);
      else setLikedLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'liked' && !likedLoadedRef.current && userId) {
      loadLikedPosts(userId, 0, true);
    }
  }, [activeTab, userId, loadLikedPosts]);

  // ── Infinite scroll sentinels ─────────────────────────────────────────────
  const ownSentinelRef = useInfiniteScroll(
    useCallback(() => {
      if (!ownLoadingRef.current && ownPostsRef.current.length < ownTotalRef.current && userId) {
        loadOwnPosts(userId, ownPostsRef.current.length, false);
      }
    }, [userId, loadOwnPosts]),
    ownLoadingMore,
    activeTab === 'own' && ownPosts.length < ownTotal,
  );

  const likedSentinelRef = useInfiniteScroll(
    useCallback(() => {
      if (!likedLoadingRef.current && likedPostsRef.current.length < likedTotalRef.current && userId) {
        loadLikedPosts(userId, likedPostsRef.current.length, false);
      }
    }, [userId, loadLikedPosts]),
    likedLoadingMore,
    activeTab === 'liked' && likedPosts.length < likedTotal,
  );

  // ── Like handler ──────────────────────────────────────────────────────────
  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) await deleteFavorite(postId);
    else await createFavorite(postId);
    const updater = (prev: Post[]) =>
      prev.map(p => {
        if (p.ID !== postId) return p;
        return isLiked
          ? { ...p, favorites: p.favorites.filter(f => f.user.ID !== userId) }
          : { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: userId ?? '' } }] };
      });
    setOwnPosts(updater);
    setLikedPosts(updater);
  };

  const handlePostClick = (postId: string) => {
    if (userId) {
      saveUserPostListCache(userId, {
        posts: ownPostsRef.current,
        total: ownTotalRef.current,
        offset: ownPostsRef.current.length,
        scrollY: scrollYRef.current,
      });
    }
    navigate(`/posts/${postId}`);
  };

  const displayedPosts = activeTab === 'own' ? ownPosts : likedPosts;
  const isLoading = activeTab === 'own' ? ownLoading : likedLoading;
  const isLoadingMore = activeTab === 'own' ? ownLoadingMore : likedLoadingMore;

  const profileActions = (
    <div className={styles.actionButtons}>
      <Link to="/mypage/profile-edit" className={styles.actionButton}>プロフィール編集</Link>
      <Link to="/mypage/user-info-edit" className={styles.actionButton}>ユーザー情報の編集</Link>
      <Link to="/mypage/favorites" className={styles.actionButton}>お気に入りリスト</Link>
      <Link to="/mypage/followers" className={styles.actionButton}>フォロワー</Link>
    </div>
  );

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>マイページ</h1>
        </div>

        {flashMessage && <p className={styles.flashMessage}>{flashMessage}</p>}

        {profileLoading ? (
          <p className={styles.loadingText}>読み込み中...</p>
        ) : profile ? (
          <ProfileCard profile={profile} actions={profileActions} />
        ) : null}

        <Tabs
          tabs={[
            { key: 'own', label: '自分の投稿' },
            { key: 'liked', label: 'いいね一覧' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {isLoading ? (
          <p className={styles.loadingText}>読み込み中...</p>
        ) : displayedPosts.length === 0 ? (
          <p className={styles.emptyText}>投稿がまだありません</p>
        ) : (
          displayedPosts.map(post => (
            <PostCard
              key={post.ID}
              post={post}
              currentUserId={userId}
              onLike={handleLike}
              onClick={() => handlePostClick(post.ID)}
            />
          ))
        )}

        <div ref={ownSentinelRef} />
        <div ref={likedSentinelRef} />

        {isLoadingMore && <p className={styles.loadingText}>読み込み中...</p>}
      </main>
    </div>
  );
};
