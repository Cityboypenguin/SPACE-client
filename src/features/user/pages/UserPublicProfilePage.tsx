import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserHeader } from '../components/organisms/UserHeader';
import { useProfile } from '../hooks/useProfile';
import { storageUrl } from '../../../lib/storage';
import { useAuth } from '../context/AuthContext';
import { createFavoriteUser, deleteFavoriteUser, getFavoriteUsersByUserID } from '../api/favorite_user';
import { createBlocker, deleteBlocker, getBlockersByUserID } from '../api/block';
import { createReport } from '../api/report';
import { PostCard } from '../components/organisms/PostCard';
import { getPostsByUserID, createFavorite, deleteFavorite, type Post } from '../api/post';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './UserPublicProfilePage.module.css';

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
    if (id) loadPosts(id, 0, true);
  }, [id, loadPosts]);

  useEffect(() => {
    const sentinel = postsSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPostsOffset((prev) => {
            if (!postsLoadingRef.current && prev < postsTotal && id) {
              loadPosts(id, prev, false);
            }
            return prev;
          });
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [id, postsTotal, loadPosts]);

  const [actionLoading, setActionLoading] = useState(false);
  const [reporting, setReporting] = useState(false);

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

  const handleReportUser = async () => {
    if (!profile || !id) return;
    const customReason = window.prompt(
      `ユーザー「${profile.user.name}」を通報する具体的な理由を入力してください。\n（例: スパム行為、嫌がらせ、不適切な発言など）`
    );
    if (customReason === null) return;
    if (customReason.trim() === '') {
      alert('通報には具体的な理由の入力が必要です。');
      return;
    }

    try {
      setReporting(true);
      await createReport({
        targetType: 'USER',
        targetID: id,
        reason: 'ユーザー報告',
        customReason: customReason,
      });
      alert('通報を送信しました。ご協力ありがとうございました。');
    } catch (err) {
      alert(toUserMessage(err, '通報の送信に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setReporting(false);
    }
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
              disabled={reporting}
              style={{
                padding: '0.4rem 1rem',
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fca5a5',
                borderRadius: '20px',
                fontWeight: 600,
                cursor: reporting ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fef2f2')}
            >
              {reporting ? '送信中...' : '⚠️ このユーザーを通報'}
            </button>
          )}
        </div>

        <h1>ユーザー詳細</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loading && <p>読み込み中...</p>}
        {profile && (
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
              <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                投稿一覧
              </h3>

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
                        currentUserId={currentUserId}
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
          </div>
        )}
      </main>
    </div>
  );
};
