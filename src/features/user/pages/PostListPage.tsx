import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { getTopLevelPosts, createPost, createFavorite, deleteFavorite, type Post } from '../api/post';
import { useAuth } from '../context/AuthContext';

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 7) return date.toLocaleDateString('ja-JP');
  if (days > 0) return `${days}日前`;
  if (hours > 0) return `${hours}時間前`;
  if (minutes > 0) return `${minutes}分前`;
  return 'たった今';
};

type PostCardProps = {
  post: Post;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onClick: () => void;
};

const PostCard = ({ post, currentUserId, onLike, onClick }: PostCardProps) => {
  const isLiked = post.favorites.some((f) => f.user.ID === currentUserId);
  const [liking, setLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    try {
      await onLike(post.ID, isLiked);
    } finally {
      setLiking(false);
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '1rem',
        borderBottom: '1px solid #e2e8f0',
        cursor: 'pointer',
        background: '#fff',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8faff')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#646cff,#a78bfa)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1.1rem',
          flexShrink: 0,
        }}
      >
        {post.user.name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{post.user.name}</span>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>@{post.user.accountID}</span>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginLeft: 'auto' }}>{formatTime(post.createdAt)}</span>
        </div>
        <p style={{ margin: '0 0 0.5rem', color: '#1e293b', lineHeight: 1.6, wordBreak: 'break-word' }}>
          {post.content}
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: '#94a3b8' }}>💬 {post.replies.length}</span>
          <button
            onClick={handleLike}
            disabled={liking || !currentUserId}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: currentUserId ? 'pointer' : 'default',
              color: isLiked ? '#f43f5e' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: isLiked ? 600 : 400,
              transition: 'color 0.1s',
            }}
          >
            {isLiked ? '❤️' : '🤍'} {post.favorites.length}
          </button>
        </div>
      </div>
    </div>
  );
};

export const PostListPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
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
    if (!content.trim() || posting) return;
    setPosting(true);
    setPostError('');
    try {
      const newPost = await createPost(content.trim());
      setContent('');
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
    // 楽観的更新
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

        {/* 投稿フォーム */}
        <div style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', display: 'flex', gap: '0.75rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#646cff,#a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            ✍️
          </div>
          <div style={{ flex: 1 }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="いまどうしてる？"
              rows={3}
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1px solid #e2e8f0',
                outline: 'none',
                resize: 'none',
                fontSize: '1.05rem',
                color: '#1e293b',
                background: 'transparent',
                padding: '0.25rem 0',
                boxSizing: 'border-box',
              }}
            />
            {postError && <p style={{ color: 'red', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{postError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                onClick={handlePost}
                disabled={!content.trim() || posting}
                style={{
                  padding: '0.45rem 1.2rem',
                  borderRadius: '20px',
                  background: content.trim() && !posting ? '#646cff' : '#c7d2fe',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: content.trim() && !posting ? 'pointer' : 'default',
                  transition: 'background 0.1s',
                }}
              >
                {posting ? '投稿中...' : '投稿する'}
              </button>
            </div>
          </div>
        </div>

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
