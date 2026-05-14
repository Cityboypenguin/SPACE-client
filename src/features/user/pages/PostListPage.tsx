import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { PostCard } from '../components/organisms/PostCard';
import { PostComposer } from '../components/organisms/PostComposer';
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  const loadPosts = () => {
    setLoading(true);
    getTopLevelPosts()
      .then(setPosts)
      .catch(() => setError('投稿の読み込みに失敗しました'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePost = async () => {
    if ((!content.trim() && !selectedFile) || posting) return;
    setPosting(true);
    setPostError('');
    try {
      let mediaInputs: MediaInput[] | undefined;
      if (selectedFile) {
        const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(selectedFile.type);
        await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, selectedFile);
        mediaInputs = [{ objectKey: presignedMediaUploadUrl.objectKey, contentType: selectedFile.type }];
      }
      const newPost = await createPost(content.trim(), undefined, mediaInputs);
      setContent('');
      setSelectedFile(null);
      setPosts((prev) => [newPost, ...prev]);
    } catch {
      setPostError('投稿に失敗しました');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) {
      await deleteFavorite(postId);
    } else {
      await createFavorite(postId);
    }
    setPosts((prev) =>
      prev.map((p) => {
        if (p.ID !== postId) return p;
        if (isLiked) {
          return { ...p, favorites: p.favorites.filter((f) => f.user.ID !== userId) };
        } else {
          return { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: userId ?? '' } }] };
        }
      }),
    );
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
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />

        {error && <p style={{ color: 'red', padding: '1rem' }}>{error}</p>}

        {loading ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
        ) : posts.length === 0 ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>投稿がまだありません</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.ID}
              post={post}
              currentUserId={userId}
              onLike={handleLike}
              onClick={() => navigate(`/posts/${post.ID}`)}
            />
          ))
        )}
      </main>
    </div>
  );
};
