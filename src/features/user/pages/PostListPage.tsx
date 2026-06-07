import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserHeader } from '../components/organisms/UserHeader';
import { PostCard } from '../components/organisms/PostCard';
import { PostComposer } from '../components/organisms/PostComposer';
import { toUserMessage } from '../../../lib/errorMessages';

import {
  getTopLevelPosts,
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

export const PostListPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { profile } = useProfile(userId);

  const { data: posts, error, isLoading, mutate } = useSWR<Post[]>('user-posts', getTopLevelPosts);

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

      mutate([newPost, ...(posts || [])], { revalidate: false });
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

      const updatedPosts = posts?.map((p) => {
        if (p.ID !== postId) return p;
        if (isLiked) {
          return { ...p, favorites: p.favorites.filter((f) => f.user.ID !== userId) };
        } else {
          return { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: userId ?? '' } }] };
        }
      });
      mutate(updatedPosts, { revalidate: false });
    } catch (err) {
      console.error('いいねの更新に失敗しました', err);
    }
  };

  return (
    <div>
      <UserHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>みんなの投稿</h1>
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
        />

        {error && <p style={{ color: 'red', padding: '1rem' }}>投稿の読み込みに失敗しました</p>}

        {isLoading ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.ID}
              post={post}
              currentUserId={userId}
              onLike={handleLike}
              onClick={() => navigate(`/posts/${post.ID}`)}
            />
          ))
        ) : (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>投稿がまだありません</p>
        )}
      </main>
    </div>
  );
};