import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { ScrollablePostsList } from '../components/organisms/ScrollablePostsList';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import styles from './UserDashboard.module.css';
import { getPostsByUserID, createFavorite, deleteFavorite, type Post } from '../api/post';
import { getUserPostListCache, saveUserPostListCache } from '../cache/postListCache';

export const UserDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [flashMessage, setFlashMessage] = useState('');
  const { userId } = useAuth();
  const { profile, loading, error } = useProfile(userId);

  const initialCacheRef = useRef(userId ? getUserPostListCache(userId) : null);
  const initialCache = initialCacheRef.current;

  const [posts, setPosts] = useState<Post[]>(initialCache?.posts ?? []);
  const [postsTotal, setPostsTotal] = useState(initialCache?.total ?? 0);
  const [postsLoading, setPostsLoading] = useState(!initialCache);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [postsErr, setPostsErr] = useState(false);
  const postsLoadingRef = useRef(false);

  const postsRef = useRef(posts);
  const totalRef = useRef(postsTotal);
  const scrollYRef = useRef(initialCache?.scrollY ?? 0);
  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => { totalRef.current = postsTotal; }, [postsTotal]);

  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!initialCache) return;
    const raf = requestAnimationFrame(() => window.scrollTo(0, initialCache.scrollY));
    return () => cancelAnimationFrame(raf);
  }, [initialCache]);

  useEffect(() => {
    return () => {
      if (userId) {
        saveUserPostListCache(userId, {
          posts: postsRef.current,
          total: totalRef.current,
          offset: postsRef.current.length,
          scrollY: scrollYRef.current,
        });
      }
    };
  }, [userId]);

  const loadPosts = useCallback(async (userID: string, currentOffset: number, isInitial: boolean) => {
    if (postsLoadingRef.current) return;
    postsLoadingRef.current = true;
    if (isInitial) setPostsLoading(true);
    else setPostsLoadingMore(true);
    try {
      const page = await getPostsByUserID(userID, 20, currentOffset);
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

  useEffect(() => {
    if (initialCache) return;
    if (userId) loadPosts(userId, 0, true);
  }, [userId, loadPosts, initialCache]);

  const postsSentinelRef = useInfiniteScroll(
    useCallback(() => {
      setPosts((prev) => {
        if (!postsLoadingRef.current && prev.length < postsTotal && userId) {
          loadPosts(userId, prev.length, false);
        }
        return prev;
      });
    }, [postsTotal, userId, loadPosts]),
    postsLoadingMore,
  );

  useEffect(() => {
    if (location.state && (location.state as { message?: string }).message) {
      setFlashMessage((location.state as { message: string }).message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
        posts: postsRef.current,
        total: totalRef.current,
        offset: postsRef.current.length,
        scrollY: scrollYRef.current,
      });
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
          <Link to="/mypage/profile-edit" className={styles.linkItem}>
            プロフィール編集
          </Link>
          <Link to="/mypage/settings" className={styles.linkItem}>
            アカウント設定
          </Link>
          <Link to="/mypage/favorites" className={styles.linkItem}>
            お気に入り一覧
          </Link>
          <Link to="/mypage/blocks" className={styles.linkItem}>
            ブロック一覧
          </Link>
        </div>

        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            自分の投稿
          </h2>
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
      </main>
    </div>
  );
};
