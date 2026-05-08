import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { PostComposer } from '../components/organisms/PostComposer';
import { ReplyThread } from '../components/organisms/ReplyThread';
import { Avatar } from '../../../components/atoms/Avatar';
import { LikeButton } from '../components/molecules/LikeButton';
import { getPostByID, createPost, createFavorite, deleteFavorite, type Post } from '../api/post';
import { useAuth } from '../context/AuthContext';

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

            <PostComposer
              value={replyContent}
              onChange={setReplyContent}
              onSubmit={handleReply}
              submitting={replying}
              error={replyError}
              placeholder="返信する..."
              rows={2}
              submitLabel="返信する"
              submittingLabel="送信中..."
              iconSize={36}
            />

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
