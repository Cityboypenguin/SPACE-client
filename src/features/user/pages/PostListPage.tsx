import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { PostCard } from '../components/organisms/PostCard';
import { PostComposer } from '../components/organisms/PostComposer';
import { ReplyModal } from '../components/organisms/ReplyModal';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './PostListPage.module.css';

import {
  getTopLevelPosts,
  getNewFeedPostsCount,
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

  const postsRef = useRef(posts);
  const totalRef = useRef(total);
  const scrollYRef = useRef(initialCache?.scrollY ?? 0);
  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => { totalRef.current = total; }, [total]);

  // スクロール位置を常時追跡（アンマウント時に window.scrollY が 0 にリセットされるため）
  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [newPostsCount, setNewPostsCount] = useState(0);
  const feedLoadedAtRef = useRef<Date | null>(null);
  const lastRefreshedAtRef = useRef<number>(0);

  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

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

  // バナーからの更新（常にフェッチ）
  const handleRefresh = useCallback(() => {
    lastRefreshedAtRef.current = Date.now();
    setNewPostsCount(0);
    feedLoadedAtRef.current = new Date();
    window.scrollTo(0, 0);
    loadPosts(0, 'refresh');
  }, [loadPosts]);

  // 上に戻るボタン（クールダウン中はスクロールのみ）
  const handleScrollToTop = useCallback(() => {
    window.scrollTo(0, 0);
    if (Date.now() - lastRefreshedAtRef.current >= REFRESH_COOLDOWN_MS) {
      lastRefreshedAtRef.current = Date.now();
      setNewPostsCount(0);
      feedLoadedAtRef.current = new Date();
      loadPosts(0, 'refresh');
    }
  }, [loadPosts]);

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
    const id = setInterval(poll, 5 * 60 * 1000);
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

  const sentinelRef = useInfiniteScroll(
    useCallback(() => {
      setPosts(prev => {
        if (!loadingRef.current && prev.length < total) loadPosts(prev.length, 'more');
        return prev;
      });
    }, [total, loadPosts]),
    loadingMore,
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
      setComposerOpen(false);
    } catch (err) {
      setPostError(toUserMessage(err, '投稿の送信に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setPosting(false);
    }
  };

  const [composerOpen, setComposerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);

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
    setPosts(prev => prev.map(p => p.ID === replyingTo.ID ? { ...p, replyCount: p.replyCount + 1 } : p));
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await deleteFavorite(postId);
      } else {
        await createFavorite(postId);
      }
      setPosts(prev => prev.map((p) => {
        if (p.ID !== postId) return p;
        if (isLiked) {
          return { ...p, favorites: p.favorites.filter((f) => f.user.ID !== userId) };
        }
        return { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: userId ?? '' } }] };
      }));
    } catch (err) {
      console.error('いいねの更新に失敗しました', err);
    }
  };

  const hasMore = posts.length < total;

  return (
    <div>
      <UserSidebar />

      <button className={styles.fab} onClick={() => setComposerOpen(true)} aria-label="新しい投稿を作成">
        <span className={styles.fabIcon}>
          <span className={styles.fabIconH} />
          <span className={styles.fabIconV} />
        </span>
      </button>

      {composerOpen && (
        <div className={styles.composerOverlay} onClick={() => setComposerOpen(false)}>
          <div className={styles.composerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.composerModalHeader}>
              <span className={styles.composerModalTitle}>新しい投稿</span>
              <button className={styles.composerModalClose} onClick={() => setComposerOpen(false)}>✕</button>
            </div>
            <PostComposer
              value={content}
              onChange={setContent}
              onSubmit={handlePost}
              submitting={posting}
              error={postError}
              userId={userId}
              avatarUrl={profile?.avatarUrl}
              userName={profile?.user.name}
              selectedFiles={selectedFiles}
              onFileSelect={setSelectedFiles}
              onCancel={() => setComposerOpen(false)}
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
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>みんなの投稿</h1>
          <button className={styles.scrollTopButton} onClick={handleScrollToTop} title="上に戻る">↑</button>
        </div>

        {newPostsCount > 0 && (
          <button className={styles.newPostsBanner} onClick={handleRefresh}>
            新着{newPostsCount}件を表示
          </button>
        )}

        <PostComposer
          value={content}
          onChange={setContent}
          onSubmit={handlePost}
          submitting={posting}
          error={postError}
          userId={userId}
          avatarUrl={profile?.avatarUrl}
          userName={profile?.user.name}
          selectedFiles={selectedFiles}
          onFileSelect={setSelectedFiles}
        />

        {loadError && <p className={styles.loadError}>投稿の読み込みに失敗しました</p>}

        {initialLoading ? (
          <p className={styles.loadingText}>読み込み中...</p>
        ) : posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.ID}
                post={post}
                currentUserId={userId}
                onLike={handleLike}
                onClick={() => handlePostClick(post.ID)}
                onReply={() => setReplyingTo(post)}
              />
            ))}
            <div ref={sentinelRef} className={styles.sentinel} />
            {loadingMore && <p className={styles.loadingMoreText}>読み込み中...</p>}
            {!hasMore && posts.length > 0 && (
              <p className={styles.allLoadedText}>すべての投稿を表示しました</p>
            )}
          </>
        ) : (
          <p className={styles.emptyText}>投稿がまだありません</p>
        )}
      </main>
    </div>
  );
};
