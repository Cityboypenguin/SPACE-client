import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { UserHeader } from '../components/organisms/UserHeader';
import { PostCard } from '../components/organisms/PostCard';
import { PostComposer } from '../components/organisms/PostComposer';
import { toUserMessage } from '../../../lib/errorMessages';

import {
  getTopLevelPosts,
  createPost,
  searchPosts,
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

export const PostListPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { profile } = useProfile(userId);

  // === 検索機能のState（HEAD） ===
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(q);

  const { data: searchResults, isLoading: isSearchLoading, mutate: mutateSearch } = useSWR<Post[]>(
    q ? ['search-posts', q] : null,
    () => searchPosts(q),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  // === 無限スクロールとタイムラインのState（Develop） ===
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

  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const loadPosts = useCallback(async (currentOffset: number, isInitial: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (isInitial) setInitialLoading(true);
    else setLoadingMore(true);
    try {
      const result = await getTopLevelPosts(LIMIT, currentOffset);
      setPosts(prev => isInitial ? result.items : [...prev, ...result.items]);
      setTotal(result.total);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      loadingRef.current = false;
      if (isInitial) setInitialLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (initialCache) return;
    loadPosts(0, true);
  }, [loadPosts, initialCache]);

  // スクロール位置の復元（rAF でブラウザの描画後に実行）
  useEffect(() => {
    if (!initialCache) return;
    const scrollY = initialCache.scrollY;
    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
    return () => cancelAnimationFrame(raf);
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
        if (!loadingRef.current && prev.length < total) loadPosts(prev.length, false);
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

      // 投稿はタイムライン（!q）でのみ行われるため、手動キャッシュ側に直接追加する
      setPosts(prev => [newPost, ...prev]);
      setTotal(prev => prev + 1);
    } catch (err) {
      setPostError(toUserMessage(err, '投稿の送信に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await deleteFavorite(postId);
      } else {
        await createFavorite(postId);
      }

      if (q) {
        // 検索中：SWRのキャッシュを更新
        const updater = (currentData?: Post[]) => currentData?.map((p) => {
          if (p.ID !== postId) return p;
          if (isLiked) return { ...p, favorites: p.favorites.filter((f) => f.user.ID !== userId) };
          return { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: userId ?? '' } }] };
        });
        mutateSearch(updater, { revalidate: false });
      } else {
        // タイムライン中：手動Stateを更新
        setPosts(prev => prev.map((p) => {
          if (p.ID !== postId) return p;
          if (isLiked) return { ...p, favorites: p.favorites.filter((f) => f.user.ID !== userId) };
          return { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: userId ?? '' } }] };
        }));
      }
    } catch (err) {
      console.error('いいねの更新に失敗しました', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: inputValue.trim() });
  };

  const hasMore = posts.length < total;

  return (
    <div>
      <UserHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form 
          onSubmit={handleSearch} 
          style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="キーワードで検索..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{
                width: '100%', 
                padding: '0.6rem 2.5rem 0.6rem 1rem',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1', 
                backgroundColor: '#f8fafc',
                fontSize: '0.95rem', 
                outline: 'none',
              }}
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  setSearchParams({});
                }}
                style={{
                  position: 'absolute', 
                  right: '0.8rem',
                  background: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontSize: '1rem', 
                  color: '#94a3b8',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </form>

        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
            {q ? `「${q}」の検索結果` : 'みんなの投稿'}
          </h1>
        </div>

        {/* タイムライン表示時のみ投稿フォームを出す */}
        {!q && (
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
        )}

        {q ? (
          // === 検索結果の描画 ===
          isSearchLoading ? (
            <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((post) => (
              <PostCard
                key={post.ID}
                post={post}
                currentUserId={userId}
                onLike={handleLike}
                onClick={() => handlePostClick(post.ID)}
              />
            ))
          ) : (
            <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>見つかりませんでした</p>
          )
        ) : (
          // === タイムライン（無限スクロール）の描画 ===
          <>
            {loadError && <p style={{ color: 'red', padding: '1rem' }}>投稿の読み込みに失敗しました</p>}
            
            {initialLoading ? (
              <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
            ) : posts.length > 0 ? (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post.ID}
                    post={post}
                    currentUserId={userId}
                    onLike={handleLike}
                    onClick={() => handlePostClick(post.ID)}
                  />
                ))}
                <div ref={sentinelRef} style={{ height: '1px' }} />
                {loadingMore && (
                  <p style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>読み込み中...</p>
                )}
                {!hasMore && posts.length > 0 && (
                  <p style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    すべての投稿を表示しました
                  </p>
                )}
              </>
            ) : (
              <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>投稿がまだありません</p>
            )}
          </>
        )}
      </main>
    </div>
  );
};