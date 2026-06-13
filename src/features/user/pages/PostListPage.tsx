import { useState } from 'react';
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

export const PostListPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { profile } = useProfile(userId);
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(q);
  const { data: posts, mutate: mutatePosts } = useSWR<Post[]>(
    !q ? 'user-posts' : null, 
    getTopLevelPosts, 
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  const { data: searchResults, isLoading: isSearchLoading, mutate: mutateSearch } = useSWR<Post[]>(
    q ? ['search-posts', q] : null,
    () => searchPosts(q), 
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

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

      mutatePosts([newPost, ...(posts || [])], { revalidate: false });
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

      // SWRのキャッシュ更新関数（共通化）
      const updater = (currentData?: Post[]) => currentData?.map((p) => {
        if (p.ID !== postId) return p;
        if (isLiked) {
          return { ...p, favorites: p.favorites.filter((f) => f.user.ID !== userId) };
        } else {
          return { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: userId ?? '' } }] };
        }
      });

      // 現在表示されている方のSWRキャッシュを更新する
      if (q) {
        mutateSearch(updater, { revalidate: false });
      } else {
        mutatePosts(updater, { revalidate: false });
      }
    } catch (err) {
      console.error('いいねの更新に失敗しました', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setSearchParams({}); // URLの ?q= を削除して一覧に戻る
      return;
    }
    setSearchParams({ q: inputValue.trim() }); // URLを ?q=キーワード に更新
  };

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
                padding: '0.6rem 2.5rem 0.6rem 1rem', // ⭕️ 右側の余白(2.5rem)を広げ、入力文字とボタンが被るのを防ぐ
                borderRadius: '9999px',
                border: '1px solid #cbd5e1', 
                backgroundColor: '#f8fafc',
                fontSize: '0.95rem', 
                outline: 'none',
              }}
            />
            {inputValue && (
              <button
                type="button" // 👈 エンターキーで誤送信されるのを防ぐ必須属性
                onClick={() => {
                  setInputValue('');   // 入力欄を空にする
                  setSearchParams({}); // URLの ?q= を削除して一覧画面に戻す
                }}
                style={{
                  position: 'absolute', 
                  right: '0.8rem', // コンテナの右端から少し内側に固定
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

        {/* トップレベル表示時のみ投稿フォームを出す（任意） */}
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

        {isSearchLoading ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
        ) : q ? (
            searchResults && searchResults.length > 0 ? (
              searchResults.map((post) => (
                <PostCard
                  key={post.ID} post={post} currentUserId={userId}
                  onLike={handleLike} onClick={() => navigate(`/posts/${post.ID}`)}
                />
              ))
            ) : (
              <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>見つかりませんでした</p>
            )
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.ID} post={post} currentUserId={userId}
                onLike={handleLike} onClick={() => navigate(`/posts/${post.ID}`)}
              />
            ))
          ) : (
            <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>投稿がありません</p>
          )}
      </main>
    </div>
  );
};