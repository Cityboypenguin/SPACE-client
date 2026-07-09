import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { Tabs } from '../../../components/molecules/Tabs';
import { PostCard } from '../components/organisms/PostCard';
import { PostComposer } from '../components/organisms/PostComposer';
import { ReplyModal } from '../components/organisms/ReplyModal';
import { ReportModal } from '../components/organisms/ReportModal';
import { toUserMessage } from '../../../lib/errorMessages';
import { useToast } from '../../../context/ToastContext';
import styles from './PostListPage.module.css';
import swal from 'sweetalert2';

import {
  getTopLevelPosts,
  getNewFeedPostsCount,
  searchPosts,
  searchPostsByHashtag,
  createPost,
  updatePost,
  deletePost,
  createFavorite,
  deleteFavorite,
  type Post,
} from '../api/post';
import { uploadMediaFiles } from '../api/media';
import { extractHashtags } from '../../../lib/hashtags';
import { createBlocker } from '../api/block';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { getPostListCache, savePostListCache } from '../cache/postListCache';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useFollowFeed } from '../hooks/useFollowFeed';
import { Footer } from '../../../components/organisms/Footer';

const LIMIT = 20;
const REFRESH_COOLDOWN_MS = 60 * 1000;

// 検索ボックスが "#タグ" 始まりならハッシュタグ完全一致検索とみなす。[1] がタグ本体。
const HASHTAG_QUERY_REGEX = /^#(\S+)/;

// 新規投稿が現在の検索条件にヒットするか（サーバーの検索と同じ判定基準）を返す。
// - "#タグ" 検索: 投稿に同名タグ（完全一致）が含まれるか。
// - 通常検索: 本文にキーワードが部分一致で含まれるか（大文字小文字は無視）。
function postMatchesSearch(content: string, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  const hashtagMatch = trimmed.match(HASHTAG_QUERY_REGEX);
  if (hashtagMatch) {
    return extractHashtags(content).includes(hashtagMatch[1]);
  }
  return content.toLowerCase().includes(trimmed.toLowerCase());
}

export const PostListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId } = useAuth();
  const { profile } = useProfile(userId);
  const { addToast } = useToast();

  const [initialCache] = useState(() => getPostListCache());

  const [posts, setPosts] = useState<Post[]>(initialCache?.posts ?? []);
  const [total, setTotal] = useState(initialCache?.total ?? 0);
  const [initialLoading, setInitialLoading] = useState(!initialCache);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const loadingRef = useRef(false);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialCache?.searchQuery ?? '');
  // submittedQuery は「実際に検索を実行したキーワード」。入力中(searchQuery)とは分離し、
  // Enter を押すまでは表示中の投稿(タイムライン)を検索結果に切り替えない。
  const [submittedQuery, setSubmittedQuery] = useState(initialCache?.searchQuery ?? '');
  const [searchResults, setSearchResults] = useState<Post[]>(initialCache?.searchResults ?? []);
  const [searchDisplayedCount, setSearchDisplayedCount] = useState(LIMIT);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommended' | 'favorites'>('recommended');
  const lastScrollYRef = useRef(0);

  // フォローフィードのデータ取得・ページングは useFollowFeed に分離済み。
  const followFeed = useFollowFeed(userId);

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
    const trimmed = keyword.trim();
    // Enter を押したこのタイミングで初めて検索結果表示へ切り替える。
    setSubmittedQuery(trimmed);
    if (!trimmed) {
      setSearchResults([]);
      setSearchDisplayedCount(LIMIT);
      return;
    }
    setSearchLoading(true);
    setSearchDisplayedCount(LIMIT);
    try {
      const hashtagMatch = trimmed.match(HASHTAG_QUERY_REGEX);
      const results = hashtagMatch
        ? await searchPostsByHashtag(hashtagMatch[1])
        : await searchPosts(trimmed);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // ハッシュタグをクリックして /home?q=#tag に遷移してきたら、ホームの検索を実行する。
  useEffect(() => {
    const q = searchParams.get('q');
    if (!q) return;
    void (async () => {
      setSearchQuery(q);
      window.scrollTo(0, 0);
      await handleSearch(q);
      // 使い終わった URL パラメータは消し、リロード/再検索での二重実行を防ぐ。
      setSearchParams({}, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [newPostsCount, setNewPostsCount] = useState(0);
  const feedLoadedAtRef = useRef<Date | null>(null);
  const lastRefreshedAtRef = useRef<number>(0);

  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [modalContent, setModalContent] = useState('');
  const [modalFiles, setModalFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  useEffect(() => {
    if (activeTab === 'favorites') {
      followFeed.ensureLoaded();
    }
  }, [activeTab, followFeed]);

  const loadPosts = useCallback(async (currentOffset: number, mode: 'initial' | 'refresh' | 'more') => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (mode === 'initial') setInitialLoading(true);
    else if (mode === 'more') setLoadingMore(true);
    try {
      const result = await getTopLevelPosts(LIMIT, currentOffset);
      setPosts(prev => {
        if (mode === 'initial') return result.items;
        const fetchedMap = new Map(result.items.map(p => [p.ID, p]));
        const prevIds = new Set(prev.map(p => p.ID));
        const newItems = result.items.filter(p => !prevIds.has(p.ID));
        if (mode === 'refresh') {
          const oldestFetchedAt = result.items.length > 0
            ? Math.min(...result.items.map(p => new Date(p.createdAt).getTime()))
            : -Infinity;
          const updated = prev
            .filter(p => {
              const t = new Date(p.createdAt).getTime();
              // リフレッシュ窓内にあるのにサーバーから返ってこなかった = 削除済み
              return t < oldestFetchedAt || fetchedMap.has(p.ID);
            })
            .map(p => fetchedMap.get(p.ID) ?? p);
          return [...newItems, ...updated];
        }
        const updated = prev.map(p => fetchedMap.get(p.ID) ?? p);
        return [...updated, ...newItems];
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
  const handleRefresh = useCallback(() => {
    lastRefreshedAtRef.current = Date.now();
    setNewPostsCount(0);
    feedLoadedAtRef.current = new Date();
    window.scrollTo(0, 0);
    loadPosts(0, 'refresh');
    followFeed.load(0, 'refresh');
  }, [loadPosts, followFeed]);

  // 上に戻るボタン（クールダウン中はスクロールのみ）
  const handleScrollToTop = useCallback(() => {
    window.scrollTo(0, 0);
    if (Date.now() - lastRefreshedAtRef.current >= REFRESH_COOLDOWN_MS) {
      lastRefreshedAtRef.current = Date.now();
      setNewPostsCount(0);
      feedLoadedAtRef.current = new Date();
      loadPosts(0, 'refresh');
      followFeed.load(0, 'refresh');
    }
  }, [loadPosts, followFeed]);

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
        searchQuery: submittedQuery,
        searchResults,
      });
    };
  }, [posts, total, submittedQuery, searchResults]);

  const isSearching = submittedQuery.trim() !== '';

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
      followFeed.loadMore();
    }, [followFeed]),
    followFeed.loadingMore,
    activeTab === 'favorites' && followFeed.posts.length < followFeed.total,
  );

  const searchSentinelRef = useInfiniteScroll(
    useCallback(() => {
      setSearchDisplayedCount(prev => prev + LIMIT);
    }, []),
    false,
    isSearching && searchDisplayedCount < searchResults.length,
  );

  const handlePostClick = (postId: string) => {
    savePostListCache({
      posts: postsRef.current,
      total: totalRef.current,
      offset: postsRef.current.length,
      scrollY: scrollYRef.current,
      searchQuery: submittedQuery,
      searchResults,
    });
    navigate(`/posts/${postId}`);
  };

  const handlePost = async () => {
    if ((!content.trim() && selectedFiles.length === 0) || posting) return;
    setPosting(true);
    setPostError('');
    try {
      const mediaInputs = await uploadMediaFiles(selectedFiles);
      const newPost = await createPost(content.trim(), undefined, mediaInputs);
      setContent('');
      setSelectedFiles([]);
      setPosts(prev => [newPost, ...prev]);
      setTotal(prev => prev + 1);
      // 検索中で、その検索条件にヒットする投稿なら検索結果にも即時反映する。
      if (postMatchesSearch(newPost.content, submittedQuery)) {
        setSearchResults(prev => [newPost, ...prev]);
      }
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
      const mediaInputs = await uploadMediaFiles(modalFiles);
      const newPost = await createPost(modalContent.trim(), undefined, mediaInputs);
      setModalContent('');
      setModalFiles([]);
      setPosts(prev => [newPost, ...prev]);
      setTotal(prev => prev + 1);
      // 検索中で、その検索条件にヒットする投稿なら検索結果にも即時反映する。
      if (postMatchesSearch(newPost.content, submittedQuery)) {
        setSearchResults(prev => [newPost, ...prev]);
      }
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

  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportingPostContent, setReportingPostContent] = useState('');

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editDeletedMediaIDs, setEditDeletedMediaIDs] = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const updatePostInAllLists = useCallback((postId: string, updater: (p: Post) => Post) => {
    setPosts(prev => prev.map(p => p.ID === postId ? updater(p) : p));
    followFeed.updatePost(postId, updater);
    setSearchResults(prev => prev.map(p => p.ID === postId ? updater(p) : p));
  }, [followFeed]);

  const handleReplySubmit = async (content: string, files: File[]) => {
    if (!replyingTo) return;
    const mediaInputs = await uploadMediaFiles(files);
    await createPost(content.trim(), replyingTo.ID, mediaInputs);
    updatePostInAllLists(replyingTo.ID, p => ({ ...p, replyCount: p.replyCount + 1 }));
  };

  const handleBlock = async (blockedUserId: string) => {
    try {
      await createBlocker(blockedUserId);
      addToast('ユーザーをブロックしました', 'success');
    } catch {
      addToast('ブロックに失敗しました', 'error');
    }
  };

  const handleReport = (postId: string, postContent: string) => {
    setReportingPostId(postId);
    setReportingPostContent(postContent);
  };

  const handleEditOpen = (post: Post) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditFiles([]);
    setEditDeletedMediaIDs([]);
    setEditError('');
  };

  const handleEditSubmit = async () => {
    if (!editingPost || editSubmitting) return;
    const remainingExisting = editingPost.media?.filter(m => !editDeletedMediaIDs.includes(m.ID)) ?? [];
    const hasAnyMedia = remainingExisting.length > 0 || editFiles.length > 0;
    if (!editContent.trim() && !hasAnyMedia) return;

    setEditSubmitting(true);
    setEditError('');
    try {
      const mediaInputs = await uploadMediaFiles(editFiles);
      const updated = await updatePost(editingPost.ID, editContent.trim(), mediaInputs, editDeletedMediaIDs);
      const filteredUpdated = {
        ...updated,
        media: updated.media?.filter(m => !editDeletedMediaIDs.includes(m.ID)) ?? [],
      };
      updatePostInAllLists(editingPost.ID, () => filteredUpdated);
      setEditingPost(null);
    } catch (err) {
      setEditError(toUserMessage(err, '投稿の更新に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    swal.fire({
      text: '本当に削除しますか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton:true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deletePost(postId);
          setPosts(prev => prev.filter(p => p.ID !== postId));
          followFeed.removePost(postId);
          setSearchResults(prev => prev.filter(p => p.ID !== postId));
          addToast('投稿を削除しました', 'success');
        } catch {
          addToast('削除に失敗しました', 'error');
        }
      } else {
        return;
      }
    });
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
    ? searchResults.slice(0, searchDisplayedCount)
    : activeTab === 'favorites'
      ? followFeed.posts
      : posts;

  const isTabLoading = activeTab === 'favorites' ? followFeed.initialLoading : initialLoading;
  const isTabLoadingMore = activeTab === 'favorites' ? followFeed.loadingMore : loadingMore;
  const hasMore = !isSearching && (
    activeTab === 'favorites'
      ? followFeed.posts.length < followFeed.total
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
              maxLength={500}
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

      {reportingPostId && (
        <ReportModal
          isOpen={true}
          onClose={() => { setReportingPostId(null); setReportingPostContent(''); }}
          targetType="POST"
          targetID={reportingPostId}
          postContent={reportingPostContent}
        />
      )}

      <main className={styles.main}>
        {newPostsCount > 0 && (
          <div className={styles.notificationBanner} onClick={handleRefresh} >
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
              onClick={() => { setSearchQuery(''); setSubmittedQuery(''); setSearchResults([]); }}
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
          maxLength={500}
        />

        {!isSearching && (
          <Tabs
            tabs={[
              { key: 'recommended', label: 'おすすめ' },
              { key: 'favorites', label: 'お気に入り' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            justify="end"
          />
        )}

        {loadError && <p className={styles.loadError}>投稿の読み込みに失敗しました</p>}

        {(isTabLoading || searchLoading) ? (
          <p className={styles.loadingText}>読み込み中...</p>
        ) : (
          <>
            {displayedPosts.map((post) =>
              editingPost?.ID === post.ID ? (
                <PostComposer
                  key={post.ID}
                  value={editContent}
                  onChange={setEditContent}
                  onSubmit={handleEditSubmit}
                  submitting={editSubmitting}
                  error={editError}
                  userId={userId}
                  avatarUrl={profile?.avatarUrl}
                  userName={profile?.user.name}
                  accountId={profile?.user.accountID}
                  selectedFiles={editFiles}
                  onFileSelect={setEditFiles}
                  existingMedia={editingPost.media}
                  deletedMediaIDs={editDeletedMediaIDs}
                  onDeleteExistingMedia={(mediaId) => setEditDeletedMediaIDs(prev => [...prev, mediaId])}
                  onCancel={() => setEditingPost(null)}
                  submitLabel="保存する"
                  submittingLabel="保存中..."
                  placeholder="投稿を編集..."
                  maxLength={500}
                  rows={3}
                />
              ) : (
                <PostCard
                  key={post.ID}
                  post={post}
                  currentUserId={userId}
                  onLike={handleLike}
                  onClick={() => handlePostClick(post.ID)}
                  onReply={() => setReplyingTo(post)}
                  onBlock={handleBlock}
                  onReport={(postId) => handleReport(postId, post.content)}
                  onEdit={handleEditOpen}
                  onDelete={handleDelete}
                />
              )
            )}
            {displayedPosts.length === 0 && (
              <p className={styles.emptyText}>
                {isSearching ? '検索結果がありません' : activeTab === 'favorites' ? 'フォロー中のユーザーの投稿がありません' : '投稿がまだありません'}
              </p>
            )}
            <div ref={recommendedSentinelRef} className={styles.sentinel} />
            <div ref={followSentinelRef} className={styles.sentinel} />
            <div ref={searchSentinelRef} className={styles.sentinel} />
            {isTabLoadingMore && <p className={styles.loadingMoreText}>読み込み中...</p>}
            {!isSearching && !hasMore && displayedPosts.length > 0 && (
              <p className={styles.allLoadedText}>すべての投稿を表示しました</p>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};
