import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { storageUrl } from '../../../lib/storage';
import styles from './UserDashboard.module.css';
import { PostCard } from '../components/organisms/PostCard';
import { getPostsByUserID, createFavorite, deleteFavorite, type Post } from '../api/post';

export const UserDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [flashMessage, setFlashMessage] = useState('');
  const { userId } = useAuth();
  const { profile, loading, error } = useProfile(userId);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsOffset, setPostsOffset] = useState(0);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [postsErr, setPostsErr] = useState(false);
  const postsLoadingRef = useRef(false);
  const postsSentinelRef = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(async (userID: string, currentOffset: number, isInitial: boolean) => {
    if (postsLoadingRef.current) return;
    postsLoadingRef.current = true;
    if (isInitial) setPostsLoading(true);
    else setPostsLoadingMore(true);
    try {
      const page = await getPostsByUserID(userID, 20, currentOffset);
      setPosts((prev) => isInitial ? page.items : [...prev, ...page.items]);
      setPostsTotal(page.total);
      setPostsOffset(currentOffset + page.items.length);
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
    if (userId) loadPosts(userId, 0, true);
  }, [userId, loadPosts]);

  useEffect(() => {
    const sentinel = postsSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPostsOffset((prev) => {
            if (!postsLoadingRef.current && prev < postsTotal && userId) {
              loadPosts(userId, prev, false);
            }
            return prev;
          });
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [userId, postsTotal, loadPosts]);

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
              {profile.avatarUrl ? (
                <img
                  src={storageUrl(profile.avatarUrl) ?? undefined}
                  alt={profile.user.name}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {profile.user.name.charAt(0)}
                </div>
              )}
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

          {postsErr && <p style={{ color: 'red', marginBottom: '1rem' }}>投稿の読み込みに失敗しました</p>}

          <div
            style={{
              maxHeight: '50vh',
              overflowY: 'auto',
              paddingRight: '0.5rem',
            }}
          >
            {postsLoading ? (
              <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
            ) : posts.length > 0 ? (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post.ID}
                    post={post}
                    currentUserId={userId}
                    onLike={handleLike}
                    onClick={() => navigate(`/posts/${post.ID}`)}
                  />
                ))}
                <div ref={postsSentinelRef} style={{ height: '1px' }} />
                {postsLoadingMore && (
                  <p style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>読み込み中...</p>
                )}
              </>
            ) : (
              <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>投稿がまだありません</p>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};
