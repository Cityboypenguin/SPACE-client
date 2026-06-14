import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { UserHeader } from '../components/organisms/UserHeader';
import { PostCard } from '../components/organisms/PostCard';
import { PostComposer } from '../components/organisms/PostComposer';
import { toUserMessage } from '../../../lib/errorMessages';

import {
  getTopLevelPosts,
  getFollowersTopLevelPosts, // ⭕️ 追加
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

// ⭕️ タブ用のスタイル
const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '0.75rem 0',
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
  cursor: 'pointer',
  fontWeight: active ? 700 : 400,
  color: active ? '#3b82f6' : '#64748b',
  fontSize: '0.95rem',
  transition: 'color 0.15s, border-color 0.15s',
});

type Tab = 'all' | 'following';

export const PostListPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { profile } = useProfile(userId);

  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(q);

  // ⭕️ タブのState管理
  const [currentTab, setCurrentTab] = useState<Tab>('all');
  const prevTabRef = useRef<Tab>(currentTab);

  const { data: searchResults, isLoading: isSearchLoading, mutate: mutateSearch } = useSWR<Post[]>(
    q ? ['search-posts', q] : null,
    () => searchPosts(q),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

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

  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  // ⭕️ 引数に targetTab を追加してAPIを分岐
  const loadPosts = useCallback(async (targetTab: Tab, currentOffset: number, isInitial: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (isInitial) setInitialLoading(true);
    else setLoadingMore(true);
    try {
      // ⭕️ タブによってAPIを切り替える
      const result = targetTab === 'all'
        ? await getTopLevelPosts(LIMIT, currentOffset)
        : await getFollowersTopLevelPosts(userId!, LIMIT, currentOffset);

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
  }, [userId]);

  // 初回ロード
  useEffect(() => {
    if (initialCache) return;
    loadPosts(currentTab, 0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPosts]);

  // ⭕️ タブ切り替え時のデータ再取得ロジック
  useEffect(() => {
    if (prevTabRef.current !== currentTab) {
      setPosts([]);
      setTotal(0);
      loadPosts(currentTab, 0, true);
      prevTabRef.current = currentTab;
    }
  }, [currentTab, loadPosts]);

  // スクロール位置の復元
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
        if (!loadingRef.current && prev.length < total) {
          loadPosts(currentTab, prev.length, false); // ⭕️ 現在のタブを渡す
        }
        return prev;
      });
    }, [total, loadPosts, currentTab]),
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

      // 投稿は「すべての投稿」タブの時のみ追加表示する
      if (currentTab === 'all') {
        setPosts(prev => [newPost, ...prev]);
        setTotal(prev => prev + 1);
      }
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
        const updater = (currentData?: Post[]) => currentData?.map((p) => {
          if (p.ID !== postId) return p;
          if (isLiked) return { ...p, favorites: p.favorites.filter((f) => f.user.ID !== userId) };
          return { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: userId ?? '' } }] };
        });
        mutateSearch(updater, { revalidate: false });
      } else {
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
          {/* 検索フォーム部分は変更なし */}
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

        {/* ⭕️ 検索していない時だけタブを表示 */}
        {!q && (
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
            <button 
              style={TAB_STYLE(currentTab === 'all')} 
              onClick={() => setCurrentTab('all')}
            >
              みんなの投稿
            </button>
            {userId && (
              <button 
                style={TAB_STYLE(currentTab === 'following')} 
                onClick={() => setCurrentTab('following')}
              >
                フォロー中
              </button>
            )}
          </div>
        )}

        {q && (
          <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
              「{q}」の検索結果
            </h1>
          </div>
        )}

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