import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { Tabs } from '../../../components/molecules/Tabs';
import { PostCard } from '../components/organisms/PostCard';
import { PostComposer } from '../components/organisms/PostComposer';
import { ReplyModal } from '../components/organisms/ReplyModal';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './PostListPage.module.css';

import {
  getTopLevelPosts,
  getFollowersTopLevelPosts,
  getNewFeedPostsCount,
  searchPosts,
  createPost,
  createFavorite,
  deleteFavorite,
  getPresignedMediaUploadUrl,
  uploadFileToStorage,
  type Post,
  type MediaInput,
} from '../api/post';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { getPostListCache, savePostListCache } from '../cache/postListCache';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const LIMIT = 20;
const REFRESH_COOLDOWN_MS = 60 * 1000;

export const PostListPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { profile } = useProfile(userId);

  const initialCacheRef = useRef(getPostListCache());
  const initialCache = initialCacheRef.current;

  const [posts, setPosts] = useState<Post[]>(initialCache?.posts ?? []);
  const [total, setTotal] = useState(initialCache?.total ?? 0);
  const [initialLoading, setInitialLoading] = useState(!initialCache);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const loadingRef = useRef(false);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommended' | 'favorites'>('recommended');
  const lastScrollYRef = useRef(0);

  const [followPosts, setFollowPosts] = useState<Post[]>([]);
  const [followTotal, setFollowTotal] = useState(0);
  const [followInitialLoading, setFollowInitialLoading] = useState(false);
  const [followLoadingMore, setFollowLoadingMore] = useState(false);
  const followLoadingRef = useRef(false);
  const followPostsRef = useRef<Post[]>([]);
  const followTotalRef = useRef(0);
  useEffect(() => { followPostsRef.current = followPosts; }, [followPosts]);
  useEffect(() => { followTotalRef.current = followTotal; }, [followTotal]);

  const postsRef = useRef(posts);
  const totalRef = useRef(total);
  const scrollYRef = useRef(initialCache?.scrollY ?? 0);
  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => { totalRef.current = total; }, [total]);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const scrollingUp = currentY < lastScrollYRef.current;

      if (currentY < 50) {
        setShowScrollTop(true);
      } else if (currentY > 300) {
        setShowScrollTop(scrollingUp);
      }
      // 50〜300px は状態を変えない（バウンス時のちらつき防止）

      lastScrollYRef.current = currentY;
      scrollYRef.current = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await searchPosts(keyword.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const [newPostsCount, setNewPostsCount] = useState(0);
  const feedLoadedAtRef = useRef<Date | null>(null);
  const lastRefreshedAtRef = useRef<number>(0);

  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [modalContent, setModalContent] = useState('');
  const [modalFiles, setModalFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const loadFollowPosts = useCallback(async (currentOffset: number, mode: 'initial' | 'refresh' | 'more') => {
    if (!userId || followLoadingRef.current) return;
    followLoadingRef.current = true;
    if (mode === 'initial' || mode === 'refresh') setFollowInitialLoading(true);
    else setFollowLoadingMore(true);
    try {
      const result = await getFollowersTopLevelPosts(userId, LIMIT, currentOffset);
      setFollowPosts(prev => {
        if (mode === 'initial' || mode === 'refresh') return result.items;
        const existingIds = new Set(prev.map(p => p.ID));
        return [...prev, ...result.items.filter(p => !existingIds.has(p.ID))];
      });
      setFollowTotal(result.total);
    } catch { /* noop */ } finally {
      followLoadingRef.current = false;
      if (mode === 'initial' || mode === 'refresh') setFollowInitialLoading(false);
      else setFollowLoadingMore(false);
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'favorites' && followPostsRef.current.length === 0 && !followLoadingRef.current) {
      loadFollowPosts(0, 'initial');
    }
  }, [activeTab, loadFollowPosts]);

  const loadPosts = useCallback(async (currentOffset: number, mode: 'initial' | 'refresh' | 'more') => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (mode === 'initial') setInitialLoading(true);
    else if (mode === 'more') setLoadingMore(true);
    try {
      const result = await getTopLevelPosts(LIMIT, currentOffset);
      setPosts(prev => {
        if (mode === 'initial') return result.items;
        const existingIds = new Set(prev.map(p => p.ID));
        const newItems = result.items.filter(p => !existingIds.has(p.ID));
        if (mode === 'refresh') return [...newItems, ...prev];
        return [...prev, ...newItems];
      });
      setTotal(result.total);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      loadingRef.current = false;
      if (mode === 'initial') setInitialLoading(false);
      else if (mode === 'more') setLoadingMore(false);
    }
  }, []);

  // バナーからの更新（常にフェッチ）※一時コメントアウト中
  // const handleRefresh = useCallback(() => {
  //   lastRefreshedAtRef.current = Date.now();
  //   setNewPostsCount(0);
  //   feedLoadedAtRef.current = new Date();
  //   window.scrollTo(0, 0);
  //   loadPosts(0, 'refresh');
  //   loadFollowPosts(0, 'refresh');
  // }, [loadPosts, loadFollowPosts]);

  // 上に戻るボタン（クールダウン中はスクロールのみ）
  const handleScrollToTop = useCallback(() => {
    window.scrollTo(0, 0);
    if (Date.now() - lastRefreshedAtRef.current >= REFRESH_COOLDOWN_MS) {
      lastRefreshedAtRef.current = Date.now();
      setNewPostsCount(0);
      feedLoadedAtRef.current = new Date();
      loadPosts(0, 'refresh');
      loadFollowPosts(0, 'refresh');
    }
  }, [loadPosts, loadFollowPosts]);

  // 5分ごとに新着件数をポーリング
  useEffect(() => {
    const poll = async () => {
      if (!feedLoadedAtRef.current) return;
      try {
        const count = await getNewFeedPostsCount(feedLoadedAtRef.current);
        setNewPostsCount(count);
      } catch {
        // ポーリング失敗は無視
      }
    };
    const id = setInterval(poll, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    feedLoadedAtRef.current = new Date();
    if (initialCache) return;
    loadPosts(0, 'initial');
  }, [loadPosts, initialCache]);

  // スクロール位置の復元（描画前に実行してちらつきを防ぐ）
  useLayoutEffect(() => {
    if (!initialCache) return;
    window.scrollTo(0, initialCache.scrollY);
  }, [initialCache]);

  // アンマウント時にキャッシュ保存
  useEffect(() => {
    return () => {
      savePostListCache({
        posts: postsRef.current,
        total: totalRef.current,
        offset: postsRef.current.length,
        scrollY: scrollYRef.current,
      });
    };
  }, []);

  const isSearching = searchQuery.trim() !== '';

  const recommendedSentinelRef = useInfiniteScroll(
    useCallback(() => {
      if (!loadingRef.current && postsRef.current.length < totalRef.current) {
        loadPosts(postsRef.current.length, 'more');
      }
    }, [loadPosts]),
    loadingMore,
    activeTab === 'recommended' && !isSearching && posts.length < total,
  );

  const followSentinelRef = useInfiniteScroll(
    useCallback(() => {
      if (!followLoadingRef.current && followPostsRef.current.length < followTotalRef.current) {
        loadFollowPosts(followPostsRef.current.length, 'more');
      }
    }, [loadFollowPosts]),
    followLoadingMore,
    activeTab === 'favorites' && followPosts.length < followTotal,
  );

  const handlePostClick = (postId: string) => {
    savePostListCache({
      posts: postsRef.current,
      total: totalRef.current,
      offset: postsRef.current.length,
      scrollY: scrollYRef.current,
    });
    navigate(`/posts/${postId}`);
  };

  const handlePost = async () => {
    if ((!content.trim() && selectedFiles.length === 0) || posting) return;
    setPosting(true);
    setPostError('');
    try {
      let mediaInputs: MediaInput[] | undefined;
      if (selectedFiles.length > 0) {
        mediaInputs = await Promise.all(
          selectedFiles.map(async (file) => {
            const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(file.type);
            await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, file);
            return { objectKey: presignedMediaUploadUrl.objectKey, contentType: file.type };
          }),
        );
      }
      const newPost = await createPost(content.trim(), undefined, mediaInputs);
      setContent('');
      setSelectedFiles([]);
      setPosts(prev => [newPost, ...prev]);
      setTotal(prev => prev + 1);
    } catch (err) {
      setPostError(toUserMessage(err, '投稿の送信に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setPosting(false);
    }
  };

  const handleModalPost = async () => {
    if ((!modalContent.trim() && modalFiles.length === 0) || posting) return;
    setPosting(true);
    setPostError('');
    try {
      let mediaInputs: MediaInput[] | undefined;
      if (modalFiles.length > 0) {
        mediaInputs = await Promise.all(
          modalFiles.map(async (file) => {
            const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(file.type);
            await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, file);
            return { objectKey: presignedMediaUploadUrl.objectKey, contentType: file.type };
          }),
        );
      }
      const newPost = await createPost(modalContent.trim(), undefined, mediaInputs);
      setModalContent('');
      setModalFiles([]);
      setPosts(prev => [newPost, ...prev]);
      setTotal(prev => prev + 1);
      setComposerOpen(false);
    } catch (err) {
      setPostError(toUserMessage(err, '投稿の送信に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setPosting(false);
    }
  };

  const handleModalCancel = () => {
    setModalContent('');
    setModalFiles([]);
    setComposerOpen(false);
  };

  const [composerOpen, setComposerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);

  const updatePostInAllLists = useCallback((postId: string, updater: (p: Post) => Post) => {
    setPosts(prev => prev.map(p => p.ID === postId ? updater(p) : p));
    setFollowPosts(prev => prev.map(p => p.ID === postId ? updater(p) : p));
  }, []);

  const handleReplySubmit = async (content: string, files: File[]) => {
    if (!replyingTo) return;
    let mediaInputs: MediaInput[] | undefined;
    if (files.length > 0) {
      mediaInputs = await Promise.all(
        files.map(async (file) => {
          const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(file.type);
          await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, file);
          return { objectKey: presignedMediaUploadUrl.objectKey, contentType: file.type };
        }),
      );
    }
    await createPost(content.trim(), replyingTo.ID, mediaInputs);
    updatePostInAllLists(replyingTo.ID, p => ({ ...p, replyCount: p.replyCount + 1 }));
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await deleteFavorite(postId);
      } else {
        await createFavorite(postId);
      }
      updatePostInAllLists(postId, p => {
        if (isLiked) {
          return { ...p, favorites: p.favorites.filter((f) => f.user.ID !== userId) };
        }
        return { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: userId ?? '' } }] };
      });
    } catch (err) {
      console.error('いいねの更新に失敗しました', err);
    }
  };

  const displayedPosts = isSearching
    ? searchResults
    : activeTab === 'favorites'
      ? followPosts
      : posts;

  const isTabLoading = activeTab === 'favorites' ? followInitialLoading : initialLoading;
  const isTabLoadingMore = activeTab === 'favorites' ? followLoadingMore : loadingMore;
  const hasMore = !isSearching && (
    activeTab === 'favorites'
      ? followPosts.length < followTotal
      : posts.length < total
  );

  return (
    <div>
      <UserSidebar />

      <div className={`${styles.fabGroup} ${showScrollTop ? styles.fabGroupExpanded : ''}`}>
        <button
          className={`${styles.scrollTopFab} ${showScrollTop ? styles.scrollTopFabVisible : ''}`}
          onClick={handleScrollToTop}
          aria-label="上に戻る"
        >
          ↑
        </button>
        <button className={styles.fab} onClick={() => setComposerOpen(true)} aria-label="新しい投稿を作成">
          <span className={styles.fabIcon}>
            <span className={styles.fabIconH} />
            <span className={styles.fabIconV} />
          </span>
        </button>
      </div>

      {composerOpen && (
        <div className={styles.composerOverlay} onClick={() => setComposerOpen(false)}>
          <div className={styles.composerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.composerModalHeader}>
              <span className={styles.composerModalTitle}>新しい投稿</span>
              <button className={styles.composerModalClose} onClick={() => setComposerOpen(false)}>✕</button>
            </div>
            <PostComposer
              value={modalContent}
              onChange={setModalContent}
              onSubmit={handleModalPost}
              submitting={posting}
              error={postError}
              userId={userId}
              avatarUrl={profile?.avatarUrl}
              userName={profile?.user.name}
              selectedFiles={modalFiles}
              onFileSelect={setModalFiles}
              onCancel={handleModalCancel}
              isEmbedded
              rows={3}
            />
          </div>
        </div>
      )}

      {replyingTo && (
        <ReplyModal
          post={replyingTo}
          onClose={() => setReplyingTo(null)}
          onSubmit={handleReplySubmit}
          userId={userId}
          avatarUrl={profile?.avatarUrl}
          userName={profile?.user.name}
        />
      )}

      <main className={styles.main}>
        {newPostsCount > 0 && (
          <div className={styles.notificationBanner} /* onClick={handleRefresh} */>
            <button
              className={styles.notificationDismiss}
              onClick={e => { e.stopPropagation(); setNewPostsCount(0); }}
              aria-label="閉じる"
            >
              ✕
            </button>
            <span>新しい投稿が{newPostsCount}件あります</span>
          </div>
        )}

        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(searchQuery); }}
          />
          {searchQuery && (
            <button
              className={styles.searchClear}
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              aria-label="クリア"
            >✕</button>
          )}
        </div>

        <PostComposer
          value={content}
          onChange={setContent}
          onSubmit={handlePost}
          submitting={posting}
          error={postError}
          placeholder="新規投稿"
          submitLabel="投稿"
          rows={1}
          userId={userId}
          avatarUrl={profile?.avatarUrl}
          userName={profile?.user.name}
          accountId={profile?.user.accountID}
          selectedFiles={selectedFiles}
          onFileSelect={setSelectedFiles}
        />

        <Tabs
          tabs={[
            { key: 'recommended', label: 'おすすめ' },
            { key: 'favorites', label: 'お気に入り' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          justify="end"
        />

        {loadError && <p className={styles.loadError}>投稿の読み込みに失敗しました</p>}

        {(isTabLoading || searchLoading) ? (
          <p className={styles.loadingText}>読み込み中...</p>
        ) : (
          <>
            {displayedPosts.map((post) => (
              <PostCard
                key={post.ID}
                post={post}
                currentUserId={userId}
                onLike={handleLike}
                onClick={() => handlePostClick(post.ID)}
                onReply={() => setReplyingTo(post)}
              />
            ))}
            {displayedPosts.length === 0 && (
              <p className={styles.emptyText}>
                {isSearching ? '検索結果がありません' : activeTab === 'favorites' ? 'フォロー中のユーザーの投稿がありません' : '投稿がまだありません'}
              </p>
            )}
            <div ref={recommendedSentinelRef} className={styles.sentinel} />
            <div ref={followSentinelRef} className={styles.sentinel} />
            {isTabLoadingMore && <p className={styles.loadingMoreText}>読み込み中...</p>}
            {!isSearching && !hasMore && displayedPosts.length > 0 && (
              <p className={styles.allLoadedText}>すべての投稿を表示しました</p>
            )}
          </>
        )}
      </main>
    </div>
  );
};
