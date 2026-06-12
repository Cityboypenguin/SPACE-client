import { useState, useEffect, useRef, useCallback } from 'react';
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
import { getPostsByUserID, createFavorite, deleteFavorite, type Post } from '../api/post';
import { toUserMessage } from '../../../lib/errorMessages';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
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
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [postsErr, setPostsErr] = useState(false);
  const postsLoadingRef = useRef(false);

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
    if (id) loadPosts(id, 0, true);
  }, [id, loadPosts]);

  const postsSentinelRef = useInfiniteScroll(
    useCallback(() => {
      setPosts((prev) => {
        if (!postsLoadingRef.current && prev.length < postsTotal && id) loadPosts(id, prev.length, false);
        return prev;
      });
    }, [postsTotal, id, loadPosts]),
    postsLoadingMore,
  );

  const [actionLoading, setActionLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

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
              <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                投稿一覧
              </h3>
              <ScrollablePostsList
                posts={posts}
                loading={postsLoading}
                loadingMore={postsLoadingMore}
                error={postsErr}
                currentUserId={currentUserId}
                sentinelRef={postsSentinelRef}
                onLike={handleLike}
                onPostClick={(postId) => navigate(`/posts/${postId}`)}
              />
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
