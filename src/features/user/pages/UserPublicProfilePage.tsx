import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ProfileCard } from '../components/organisms/ProfileCard';
import { ScrollablePostsList } from '../components/organisms/ScrollablePostsList';
import { ReportModal } from '../components/organisms/ReportMadal';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { createFavoriteUser, deleteFavoriteUser, getFavoriteUsersByUserID } from '../api/favorite_user';
import { createBlocker, deleteBlocker, getBlockersByUserID } from '../api/block';
import { getOrCreateDMRoom } from '../api/message';
import { getPostsByUserID, createFavorite, deleteFavorite, type Post } from '../api/post';
import { toUserMessage } from '../../../lib/errorMessages';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { getUserPostListCache, saveUserPostListCache } from '../cache/postListCache';
import blockIcon from '../../../assets/パーツ_ブロック.svg';
import reportIcon from '../../../assets/パーツ_通報.svg';
import favoriteIcon from '../../../assets/パーツ_お気に入り.svg';
import dmIcon from '../../../assets/パーツ_メール.svg';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from './UserPublicProfilePage.module.css';

export const UserPublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, loading, error } = useProfile(id);
  const { userId: currentUserId } = useAuth();
  const { addToast } = useToast();
  const isMe = currentUserId === id;

  // ── three-dot menu ────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // ── favorite / block ──────────────────────────────────────────────────────
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

  const [actionLoading, setActionLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // ── posts ─────────────────────────────────────────────────────────────────
  const initialCacheRef = useRef(id ? getUserPostListCache(id) : null);
  const initialCache = initialCacheRef.current;

  const [posts, setPosts] = useState<Post[]>(initialCache?.posts ?? []);
  const [postsTotal, setPostsTotal] = useState(initialCache?.total ?? 0);
  const [postsLoading, setPostsLoading] = useState(!initialCache);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
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

  useLayoutEffect(() => {
    if (!initialCache) return;
    window.scrollTo(0, initialCache.scrollY);
  }, [initialCache]);

  useEffect(() => {
    return () => {
      if (id) {
        saveUserPostListCache(id, {
          posts: postsRef.current,
          total: totalRef.current,
          offset: postsRef.current.length,
          scrollY: scrollYRef.current,
        });
      }
    };
  }, [id]);

  const loadPosts = useCallback(async (userID: string, currentOffset: number, isInitial: boolean) => {
    if (postsLoadingRef.current) return;
    postsLoadingRef.current = true;
    if (isInitial) setPostsLoading(true);
    else setPostsLoadingMore(true);
    try {
      const page = await getPostsByUserID(userID, 20, currentOffset);
      setPosts((prev) => {
        if (isInitial) return page.items;
        const existingIds = new Set(prev.map(p => p.ID));
        return [...prev, ...page.items.filter(p => !existingIds.has(p.ID))];
      });
      setPostsTotal(page.total);
    } catch { /* noop */ } finally {
      postsLoadingRef.current = false;
      if (isInitial) setPostsLoading(false);
      else setPostsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (initialCache) return;
    if (id) loadPosts(id, 0, true);
  }, [id, loadPosts, initialCache]);

  const postsSentinelRef = useInfiniteScroll(
    useCallback(() => {
      setPosts((prev) => {
        if (!postsLoadingRef.current && prev.length < postsTotal && id) loadPosts(id, prev.length, false);
        return prev;
      });
    }, [postsTotal, id, loadPosts]),
    postsLoadingMore,
  );

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) await deleteFavorite(postId);
    else await createFavorite(postId);
    setPosts((prev) => prev.map((p) => {
      if (p.ID !== postId) return p;
      return isLiked
        ? { ...p, favorites: p.favorites.filter((f) => f.user.ID !== currentUserId) }
        : { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: currentUserId ?? '' } }] };
    }));
  };

  const handlePostClick = (postId: string) => {
    if (id) {
      saveUserPostListCache(id, {
        posts: postsRef.current,
        total: totalRef.current,
        offset: postsRef.current.length,
        scrollY: scrollYRef.current,
      });
    }
    navigate(`/posts/${postId}`);
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
      addToast(toUserMessage(err, 'お気に入りの操作に失敗しました。'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!id) return;
    if (!isBlocked && !window.confirm('本当にこのユーザーをブロックしますか？')) return;
    setMenuOpen(false);
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
      addToast(toUserMessage(err, 'ブロックの操作に失敗しました。'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDM = async () => {
    if (!id) return;
    setDmLoading(true);
    try {
      const { getOrCreateDMRoom: room } = await getOrCreateDMRoom(id);
      navigate(`/dm/${room.ID}`);
    } catch (err) {
      addToast(toUserMessage(err, 'DMの開始に失敗しました。'), 'error');
    } finally {
      setDmLoading(false);
    }
  };

  const handleReportUser = () => {
    setMenuOpen(false);
    setIsReportOpen(true);
  };

  // ── right-side action buttons (passed to ProfileCard) ────────────────────
  const rightActions = profile && !isMe ? (
    <div className={styles.profileActions}>
      {!isBlocked && (
        <button
          className={`${styles.profileActionButton}${isFavorited ? ` ${styles.profileActionButtonFavorited}` : ''}`}
          onClick={handleFavoriteToggle}
          disabled={actionLoading}
        >
          <img
            src={favoriteIcon}
            alt=""
            className={`${styles.profileActionIcon}${isFavorited ? ` ${styles.profileActionIconFavorited}` : ''}`}
          />
          {isFavorited ? 'お気に入り解除' : 'お気に入り'}
        </button>
      )}
      <button
        className={styles.profileActionButton}
        onClick={handleDM}
        disabled={dmLoading}
      >
        <img src={dmIcon} alt="" className={styles.profileActionIcon} />
        DMを開始
      </button>
    </div>
  ) : undefined;

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft />
          </button>
          {profile && !isMe && (
            <div className={styles.menuWrap} ref={menuRef}>
              <button
                className={styles.menuButton}
                onClick={() => setMenuOpen(v => !v)}
                aria-label="メニュー"
              >
                ···
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <button
                    className={styles.dropdownItem}
                    onClick={handleBlockToggle}
                    disabled={actionLoading}
                  >
                    <img src={blockIcon} alt="" className={styles.dropdownIcon} />
                    {isBlocked ? 'ブロック解除' : 'ブロック'}
                  </button>
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                    onClick={handleReportUser}
                  >
                    <img src={reportIcon} alt="" className={styles.dropdownIcon} />
                    通報
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p style={{ color: 'red', padding: '0 1rem' }}>{error}</p>}
        {loading && <p style={{ color: '#94a3b8', padding: '1rem' }}>読み込み中...</p>}

        {profile && (
          <>
            <ProfileCard profile={profile} rightActions={rightActions} />
            <hr className={styles.divider} />
            <ScrollablePostsList
              posts={posts}
              loading={postsLoading}
              loadingMore={postsLoadingMore}
              error={false}
              currentUserId={currentUserId}
              sentinelRef={postsSentinelRef}
              onLike={handleLike}
              onPostClick={handlePostClick}
            />
          </>
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
