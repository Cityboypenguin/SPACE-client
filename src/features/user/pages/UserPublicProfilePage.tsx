import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ProfileCard } from '../components/organisms/ProfileCard';
import { ScrollablePostsList } from '../components/organisms/ScrollablePostsList';
import { ReportModal } from '../components/organisms/ReportModal';
import { ReplyModal } from '../components/organisms/ReplyModal';
import { PublicTimetableOverlay } from '../components/organisms/PublicTimetableOverlay';
import { ProfileTimetableButton } from '../components/molecules/ProfileTimetableButton';
import { ProfilePillButton } from '../components/molecules/ProfilePillButton';
import { DropdownMenu, DropdownMenuItem } from '../../../components/molecules/DropdownMenu';
import { Tabs } from '../../../components/molecules/Tabs';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../context/useAuth';
import { useToast } from '../../../context/useToast';
import { createFavoriteUser, deleteFavoriteUser, getFavoriteUsersByUserID } from '../api/favorite_user';
import { createBlocker, deleteBlocker, getBlockersByUserID } from '../api/block';
import { getOrCreateDMRoom } from '../api/message';
import { getPostsByUserID, getFavoritePostsByUserID, createPost, createFavorite, deleteFavorite, type Post } from '../api/post';
import { uploadMediaFiles } from '../api/media';
import { toUserMessage } from '../../../lib/errorMessages';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { getUserPostListCache, saveUserPostListCache } from '../cache/postListCache';
import { staticCacheOptions } from '../cache/swrOptions';
import redblockIcon from '../../../assets/パーツ_ブロック（赤）.svg';
import blockIcon from '../../../assets/パーツ_ブロック.svg';
import reportIcon from '../../../assets/パーツ_通報.svg';
import favoriteIconOn from '../../../assets/パーツ_お気に入り（ON）.svg';
import dmIcon from '../../../assets/パーツ_メール.svg';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from './UserPublicProfilePage.module.css';
import { AppSwal } from '../../../lib/swal';
import { withLikeToggled } from '../../../lib/postUtils';

export const UserPublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, loading, error } = useProfile(id);
  const { userId: currentUserId } = useAuth();
  const { profile: currentUserProfile } = useProfile(currentUserId);
  const { addToast } = useToast();
  const isMe = currentUserId === id;

  // ── three-dot menu ────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);

  // ── favorite / block ──────────────────────────────────────────────────────
  const { data: favoriteUsers, mutate: mutateFavorites } = useSWR(
    currentUserId && !isMe ? ['favorite-users', currentUserId] : null,
    ([, uid]: [string, string]) => getFavoriteUsersByUserID(uid),
    staticCacheOptions,
  );
  const { data: blockedUsers, mutate: mutateBlocked } = useSWR(
    currentUserId && !isMe ? ['blocked-users', currentUserId] : null,
    ([, uid]: [string, string]) => getBlockersByUserID(uid),
    staticCacheOptions,
  );

  const isFavorited = favoriteUsers?.some((u) => u.ID === id) ?? false;
  const isBlocked = blockedUsers?.some((u) => u.ID === id) ?? false;

  const [actionLoading, setActionLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportingPostContent, setReportingPostContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);

  // ── tabs ──────────────────────────────────────────────────────────────────
  // 「投稿」と「いいね」はサーバー側のクエリが別（getPostsByUserID /
  // getFavoritePostsByUserID）なので、マイページ（UserDashboard）と同じく
  // タブごとに状態を分けて持つ。投稿タブの一覧をクライアントで絞り込む形にはできない。
  // Post は favoriteCount / isFavoritedByMe しか持たず「その投稿を誰がいいねしたか」を
  // 返さないため、この人がいいねした投稿はサーバーに聞くしかない
  //（api/post.ts の Post のコメント参照）。
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  // アンマウント時のキャッシュ保存はクリーンアップ関数の中で走るので、
  // そこから今のタブを見るために ref でも持っておく。
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // ── posts（投稿タブ） ─────────────────────────────────────────────────────
  const [initialCache] = useState(() => id ? getUserPostListCache(id) : null);

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

  // ── liked（いいねタブ） ───────────────────────────────────────────────────
  // 投稿タブと違ってキャッシュには載せない。タブが開かれるまで読まず、開かれたら
  // その場で取る（UserDashboard のいいね一覧と同じ）。
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
          // いいねタブを見ている間の位置は投稿タブのキャッシュに入れない。
          // 戻ってきたときに開くのは常に投稿タブなので、そこで復元して意味が
          // あるのは投稿タブを見ていたときの位置だけ。
          scrollY: activeTabRef.current === 'posts' ? scrollYRef.current : 0,
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

  // 別の人のプロフィールへ移っても、このページは同じインスタンスのまま id だけが
  // 変わる（ルートに key を付けていないため）。useState の初期化関数はマウント時に
  // しか走らないので、id が変わったぶんはここで読み替える。
  const loadedUserIdRef = useRef(id);
  useEffect(() => {
    if (loadedUserIdRef.current === id) return;
    loadedUserIdRef.current = id;

    // 投稿タブ: 新しい人のキャッシュがあれば載せ替え、無ければ空にして読み直させる。
    const cached = id ? getUserPostListCache(id) : null;
    setPosts(cached?.posts ?? []);
    setPostsTotal(cached?.total ?? 0);
    setPostsLoading(!cached);
    scrollYRef.current = cached?.scrollY ?? 0;
    window.scrollTo(0, cached?.scrollY ?? 0);

    // いいねタブ: 開かれるまで読まないので、空に戻すだけでよい。
    likedLoadedRef.current = false;
    setLikedPosts([]);
    setLikedTotal(0);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    // マウント時の initialCache と同じ判定だが、id が変わったときも効くように
    // その場で引き直す。
    if (getUserPostListCache(id)) return;
    void Promise.resolve().then(() => loadPosts(id, 0, true));
  }, [id, loadPosts]);

  const postsSentinelRef = useInfiniteScroll(
    useCallback(() => {
      setPosts((prev) => {
        if (!postsLoadingRef.current && prev.length < postsTotal && id) loadPosts(id, prev.length, false);
        return prev;
      });
    }, [postsTotal, id, loadPosts]),
    postsLoadingMore,
    activeTab === 'posts',
  );

  const loadLikedPosts = useCallback(async (userID: string, currentOffset: number, isInitial: boolean) => {
    if (likedLoadingRef.current) return;
    likedLoadingRef.current = true;
    if (isInitial) setLikedLoading(true);
    else setLikedLoadingMore(true);
    try {
      const page = await getFavoritePostsByUserID(userID, 20, currentOffset);
      setLikedPosts((prev) => {
        if (isInitial) return page.items;
        const existingIds = new Set(prev.map(p => p.ID));
        return [...prev, ...page.items.filter(p => !existingIds.has(p.ID))];
      });
      setLikedTotal(page.total);
      likedLoadedRef.current = true;
    } catch { /* noop */ } finally {
      likedLoadingRef.current = false;
      if (isInitial) setLikedLoading(false);
      else setLikedLoadingMore(false);
    }
  }, []);

  // いいねタブは開かれたときに初めて読む
  useEffect(() => {
    if (activeTab !== 'liked' || likedLoadedRef.current || !id) return;
    void loadLikedPosts(id, 0, true);
  }, [activeTab, id, loadLikedPosts]);

  const likedSentinelRef = useInfiniteScroll(
    useCallback(() => {
      if (!likedLoadingRef.current && likedPostsRef.current.length < likedTotalRef.current && id) {
        loadLikedPosts(id, likedPostsRef.current.length, false);
      }
    }, [id, loadLikedPosts]),
    likedLoadingMore,
    activeTab === 'liked',
  );

  // 相手の新着投稿をポーリングして先頭に反映する
  const checkForNewPosts = useCallback(async (userID: string) => {
    if (postsLoadingRef.current) return;
    try {
      const page = await getPostsByUserID(userID, 20, 0);
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.ID));
        const newItems = page.items.filter((p) => !existingIds.has(p.ID));
        return newItems.length > 0 ? [...newItems, ...prev] : prev;
      });
      setPostsTotal((prevTotal) => Math.max(prevTotal, page.total));
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => checkForNewPosts(id), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [id, checkForNewPosts]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) await deleteFavorite(postId);
    else await createFavorite(postId);
    // どちらのタブから押しても、もう片方に同じ投稿が並んでいることがある。
    const updater = (prev: Post[]) => prev.map((p) => {
      if (p.ID !== postId) return p;
      return withLikeToggled(p, isLiked);
    });
    setPosts(updater);
    setLikedPosts(updater);
  };

  const handlePostClick = (postId: string) => {
    if (id) {
      saveUserPostListCache(id, {
        posts: postsRef.current,
        total: totalRef.current,
        offset: postsRef.current.length,
        scrollY: activeTab === 'posts' ? scrollYRef.current : 0,
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
        if (profile) {
          mutateFavorites(
            (prev) => [
              ...(prev ?? []),
              { ID: profile.user.ID, name: profile.user.name, accountID: profile.user.accountID, avatarUrl: profile.user.avatarUrl },
            ],
            { revalidate: false },
          );
        }
      }
    } catch (err) {
      addToast(toUserMessage(err, 'お気に入りの操作に失敗しました。'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const addBlockedUserOptimistic = () => {
    if (!profile) return;
    mutateBlocked(
      (prev) => [...(prev ?? []), { ID: profile.user.ID, name: profile.user.name, accountID: profile.user.accountID, avatarUrl: profile.user.avatarUrl }],
      { revalidate: false },
    );
  };

  const handleBlockToggle = async () => {
    if (!id) return;
    if (!isBlocked) {
      const result = await AppSwal.fire({
        text: '本当にこのユーザーをブロックしますか？',
        confirmButtonText: 'はい',
        cancelButtonText: 'いいえ',
        showCancelButton: true,
      });
      if (!result.isConfirmed) return;
    }
    setMenuOpen(false);
    setActionLoading(true);
    try {
      if (isBlocked) {
        await deleteBlocker(id);
        mutateBlocked((prev) => prev?.filter((u) => u.ID !== id), { revalidate: false });
        void loadPosts(id, 0, true);
        // いいねタブも取り直す。開いていなければ次に開いたときに読まれる。
        likedLoadedRef.current = false;
        setLikedPosts([]);
        setLikedTotal(0);
        if (activeTab === 'liked') void loadLikedPosts(id, 0, true);
        addToast('ブロックを解除しました', 'success');
      } else {
        await createBlocker(id);
        addBlockedUserOptimistic();
        setPosts([]);
        setPostsTotal(0);
        setLikedPosts([]);
        setLikedTotal(0);
        likedLoadedRef.current = false;
        if (isFavorited) {
          mutateFavorites((prev) => prev?.filter((u) => u.ID !== id), { revalidate: false });
        }
        addToast('ユーザーをブロックしました', 'success');
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

  const handlePostBlock = async (blockedUserId: string) => {
    try {
      await createBlocker(blockedUserId);
      setPosts((prev) => prev.filter((p) => p.user.ID !== blockedUserId));
      setLikedPosts((prev) => prev.filter((p) => p.user.ID !== blockedUserId));
      if (blockedUserId === id) {
        addBlockedUserOptimistic();
        setPostsTotal(0);
        setLikedTotal(0);
        if (isFavorited) mutateFavorites((prev) => prev?.filter((u) => u.ID !== blockedUserId), { revalidate: false });
      }
      addToast('ユーザーをブロックしました', 'success');
    } catch {
      addToast('ブロックに失敗しました', 'error');
    }
  };

  const handlePostReport = (postId: string, postContent: string) => {
    setReportingPostId(postId);
    setReportingPostContent(postContent);
  };

  const handleReplySubmit = async (content: string, files: File[]) => {
    if (!replyingTo) return;
    const mediaInputs = await uploadMediaFiles(files);
    await createPost(content.trim(), replyingTo.ID, mediaInputs);
    const bumpReplyCount = (prev: Post[]) =>
      prev.map((p) => p.ID === replyingTo.ID ? { ...p, replyCount: p.replyCount + 1 } : p);
    setPosts(bumpReplyCount);
    setLikedPosts(bumpReplyCount);
  };

  // ── profile action buttons (passed to ProfileCard) ───────────────────────
  const displayedPosts = activeTab === 'posts' ? posts : likedPosts;
  const displayedLoading = activeTab === 'posts' ? postsLoading : likedLoading;
  const displayedLoadingMore = activeTab === 'posts' ? postsLoadingMore : likedLoadingMore;

  const profileActions = profile && !isMe ? (
    <div className={styles.profileActions}>
      {!isBlocked && (
        <ProfilePillButton
          icon={favoriteIconOn}
          label={isFavorited ? 'お気に入り解除' : 'お気に入り登録'}
          onClick={handleFavoriteToggle}
          disabled={actionLoading}
          className={`${styles.profileFavoriteButton}${isFavorited ? ` ${styles.profileActionButtonFavorited}` : ''}`}
          iconClassName={`${styles.profileFavoriteIcon}${isFavorited ? ` ${styles.profileFavoriteIconFavorited}` : ''}`}
        />
      )}
      <div className={styles.profileActionPair}>
        {!isBlocked && <ProfileTimetableButton onClick={() => setIsTimetableOpen(true)} />}
        <ProfilePillButton
          icon={dmIcon}
          onClick={handleDM}
          disabled={dmLoading}
          iconOnly
          themedIcon
          ariaLabel="DMを開始"
          title="DMを開始"
        />
      </div>
    </div>
  ) : undefined;

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <button onClick={() => navigate(-1)}>
            <ChevronLeft />
          </button>
          {profile && !isMe && (
            <DropdownMenu triggerClassName={styles.menuButton} open={menuOpen} onOpenChange={setMenuOpen}>
              {() => (
                <>
                  <DropdownMenuItem
                    icon={isBlocked ? blockIcon : redblockIcon}
                    themedIcon={isBlocked}
                    danger={!isBlocked}
                    onClick={handleBlockToggle}
                    disabled={actionLoading}
                  >
                    {isBlocked ? 'ブロック解除' : 'ブロック'}
                  </DropdownMenuItem>
                  <DropdownMenuItem icon={reportIcon} themedIcon onClick={handleReportUser}>
                    通報
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenu>
          )}
        </div>

        {error && <p className={styles.errorText}>{error}</p>}
        {loading && <p className={styles.loadingText}>読み込み中...</p>}

        {profile && (
          <>
            <ProfileCard profile={profile} actions={profileActions} />
            <hr className={styles.divider} />
            <Tabs
              tabs={[
                { key: 'posts', label: '投稿' },
                { key: 'liked', label: 'いいね一覧' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            <ScrollablePostsList
              posts={displayedPosts}
              loading={displayedLoading}
              loadingMore={displayedLoadingMore}
              error={false}
              currentUserId={currentUserId}
              sentinelRef={activeTab === 'posts' ? postsSentinelRef : likedSentinelRef}
              onLike={handleLike}
              onPostClick={handlePostClick}
              onReply={setReplyingTo}
              onBlock={handlePostBlock}
              onReport={(postId) => handlePostReport(postId, displayedPosts.find(p => p.ID === postId)?.content ?? '')}
              emptyMessage={activeTab === 'liked' ? 'いいねした投稿がまだありません' : '投稿がまだありません'}
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

      {replyingTo && (
        <ReplyModal
          post={replyingTo}
          onClose={() => setReplyingTo(null)}
          onSubmit={handleReplySubmit}
          userId={currentUserId}
          avatarUrl={currentUserProfile?.avatarUrl}
          userName={currentUserProfile?.user.name}
        />
      )}

      {reportingPostId && (
        <ReportModal
          isOpen={true}
          onClose={() => { setReportingPostId(null); setReportingPostContent(''); }}
          targetType="POST"
          targetID={reportingPostId}
          postContent={reportingPostContent}
        />
      )}

      {profile && isTimetableOpen && (
        <PublicTimetableOverlay
          userId={profile.user.ID}
          userName={profile.user.name}
          isMe={isMe}
          onClose={() => setIsTimetableOpen(false)}
        />
      )}
    </div>
  );
};
