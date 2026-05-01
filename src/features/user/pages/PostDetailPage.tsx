import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { getPostByID, createPost, createFavorite, deleteFavorite, type Post } from '../api/post';
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

const Avatar = ({ name, size = 40 }: { name: string; size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg,#646cff,#a78bfa)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: size * 0.4,
      flexShrink: 0,
    }}
  >
    {name.charAt(0).toUpperCase()}
  </div>
);

type LikeButtonProps = {
  post: Post;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  large?: boolean;
};

const LikeButton = ({ post, currentUserId, onLike, large }: LikeButtonProps) => {
  const isLiked = post.favorites.some((f) => f.user.ID === currentUserId);
  const [liking, setLiking] = useState(false);

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liking || !currentUserId) return;
    setLiking(true);
    try {
      await onLike(post.ID, isLiked);
    } finally {
      setLiking(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={liking || !currentUserId}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: currentUserId ? 'pointer' : 'default',
        color: isLiked ? '#f43f5e' : '#94a3b8',
        fontSize: large ? '0.95rem' : '0.82rem',
        fontWeight: isLiked ? 600 : 400,
        transition: 'color 0.1s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      {isLiked ? '❤️' : '🤍'}
      {large ? <strong>{post.favorites.length}</strong> : post.favorites.length}
      {large && <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 2 }}>いいね</span>}
    </button>
  );
};

type ReplyThreadProps = {
  post: Post;
  depth?: number;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
};

const ReplyThread = ({ post, depth = 0, currentUserId, onLike }: ReplyThreadProps) => {
  const navigate = useNavigate();

  return (
    <div>
      <div
        onClick={() => navigate(`/posts/${post.ID}`)}
        style={{
          display: 'flex',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          cursor: 'pointer',
          background: '#fff',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8faff')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar name={post.user.name} size={36} />
          {post.replies.length > 0 && (
            <div style={{ width: 2, flex: 1, background: '#e2e8f0', marginTop: 4 }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingBottom: post.replies.length > 0 ? '0.5rem' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{post.user.name}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>@{post.user.accountID}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem', marginLeft: 'auto' }}>{formatTime(post.createdAt)}</span>
          </div>
          <p style={{ margin: '0 0 0.4rem', color: '#1e293b', lineHeight: 1.6, wordBreak: 'break-word', fontSize: '0.95rem' }}>
            {post.content}
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem' }}>
            <span style={{ color: '#94a3b8' }}>💬 {post.replies.length}</span>
            <LikeButton post={post} currentUserId={currentUserId} onLike={onLike} />
          </div>
        </div>
      </div>

      {post.replies.length > 0 && (
        <div style={{ marginLeft: depth === 0 ? '2.75rem' : '2rem', borderLeft: '2px solid #e2e8f0' }}>
          {post.replies.map((reply) => (
            <ReplyThread key={reply.ID} post={reply} depth={depth + 1} currentUserId={currentUserId} onLike={onLike} />
          ))}
        </div>
      )}

      {depth === 0 && <div style={{ borderBottom: '1px solid #e2e8f0' }} />}
    </div>
  );
};

export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const loadPost = (postId: string) => {
    setLoading(true);
    getPostByID(postId)
      .then(setPost)
      .catch(() => setError('投稿の読み込みに失敗しました'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) loadPost(id);
  }, [id]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (isLiked) {
      await deleteFavorite(postId);
    } else {
      await createFavorite(postId);
    }
    if (id) loadPost(id);
  };

  const handleReply = async () => {
    if (!replyContent.trim() || replying || !id) return;
    setReplying(true);
    setReplyError('');
    try {
      await createPost(replyContent.trim(), id);
      setReplyContent('');
      loadPost(id);
    } catch {
      setReplyError('返信に失敗しました');
    } finally {
      setReplying(false);
    }
  };

  return (
    <div>
      <UserHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.1rem', padding: '0.25rem 0.5rem', borderRadius: '50%' }}
          >
            ←
          </button>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>投稿</h1>
        </div>

        {error && <p style={{ color: 'red', padding: '1rem' }}>{error}</p>}

        {loading ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
        ) : !post ? (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>投稿が見つかりません</p>
        ) : (
          <>
            {/* メインポスト */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Avatar name={post.user.name} size={44} />
                <div>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{post.user.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>@{post.user.accountID}</div>
                </div>
              </div>
              <p style={{ margin: '0 0 0.75rem', color: '#1e293b', fontSize: '1.1rem', lineHeight: 1.7, wordBreak: 'break-word' }}>
                {post.content}
              </p>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {new Date(post.createdAt).toLocaleString('ja-JP')}
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  💬 <strong>{post.replies.length}</strong> 件の返信
                </span>
                <LikeButton post={post} currentUserId={userId} onLike={handleLike} large />
              </div>
            </div>

            {/* 返信フォーム */}
            <div style={{ padding: '0.75rem 1rem', borderBottom: '2px solid #e2e8f0', display: 'flex', gap: '0.75rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#646cff,#a78bfa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                ✍️
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  ref={replyRef}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="返信する..."
                  rows={2}
                  style={{
                    width: '100%',
                    border: 'none',
                    borderBottom: '1px solid #e2e8f0',
                    outline: 'none',
                    resize: 'none',
                    fontSize: '0.95rem',
                    color: '#1e293b',
                    background: 'transparent',
                    padding: '0.25rem 0',
                    boxSizing: 'border-box',
                  }}
                />
                {replyError && <p style={{ color: 'red', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>{replyError}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                  <button
                    onClick={handleReply}
                    disabled={!replyContent.trim() || replying}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '20px',
                      background: replyContent.trim() && !replying ? '#646cff' : '#c7d2fe',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: replyContent.trim() && !replying ? 'pointer' : 'default',
                      transition: 'background 0.1s',
                    }}
                  >
                    {replying ? '送信中...' : '返信する'}
                  </button>
                </div>
              </div>
            </div>

            {/* リプライスレッド */}
            {post.replies.length > 0 && (
              <div>
                {post.replies.map((reply) => (
                  <ReplyThread key={reply.ID} post={reply} currentUserId={userId} onLike={handleLike} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
