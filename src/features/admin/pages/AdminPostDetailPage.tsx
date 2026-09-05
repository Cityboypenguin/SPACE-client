import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminPostCard } from '../components/organisms/AdminPostCard';
import { AdminUserAvatar } from '../../../components/atoms/AdminUserAvatar';
import { AdminUserNameLink } from '../../../components/atoms/AdminUserNameLink';
import { LikeButton } from '../../../components/molecules/LikeButton';
import { getPostByID, adminDeletePost, type Post, type Media } from '../api/posts';
import { useToast } from '../../../context/useToast';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { PostMediaGrid } from '../../../components/molecules/PostMediaGrid';

const PostMediaDetail = ({ media }: { media: Media[] }) => <PostMediaGrid media={media} large />;

export const AdminPostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const loadPost = useCallback((postId: string) => {
    setLoading(true);
    setError('');
    getPostByID(postId)
      .then(setPost)
      .catch(() => setError('投稿の読み込みに失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (id) void Promise.resolve().then(() => loadPost(id));
  }, [id, loadPost]);

  const handleMainDelete = async () => {
    if (!id || !window.confirm('この親投稿を削除しますか？')) return;
    try {
      await adminDeletePost(id);
      setPost(prev => prev ? { ...prev, deletedAt: new Date().toISOString() } : null);
      addToast('削除しました', 'success');
    } catch (err) {
      console.error(err);
      addToast('削除に失敗しました', 'error');
    }
  };

  const handleReplyDelete = async (replyId: string) => {
    if (!window.confirm('この返信を削除しますか？')) return;
    try {
      await adminDeletePost(replyId);
      setPost(prev => prev ? {
        ...prev,
        replies: prev.replies.map(r => r.ID === replyId ? { ...r, deletedAt: new Date().toISOString() } : r)
      } : null);
      addToast('削除しました', 'success');
    } catch (err) {
      console.error(err);
      addToast('削除に失敗しました', 'error');
    }
  };

  const isDeleted = post?.deletedAt != null;

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => navigate(-1)}
          ><ChevronLeft /></button>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>投稿詳細 (管理者)</h1>
        </div>

        {error && <p style={{ color: 'var(--color-danger)', padding: '1rem' }}>{error}</p>}

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
        ) : !post ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '2rem', textAlign: 'center' }}>投稿が見つかりません</p>
        ) : (
          <>
            {post.rootPost && (
              <div style={{ paddingBottom: '0.5rem' }}>
                <AdminPostCard
                  post={post.rootPost}
                  isDetail={false}
                  onDelete={async () => { }}
                />
              </div>
            )}

            <div style={{
              padding: '1rem',
              borderBottom: '1px solid var(--color-border)',
              background: isDeleted ? 'var(--color-danger-bg)' : 'var(--color-bg-elevated)'
            }}>

              {isDeleted && (
                <div style={{
                  display: 'inline-block',
                  background: 'var(--color-danger)', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold',
                  padding: '0.25rem 0.5rem', borderRadius: '4px', marginBottom: '0.75rem'
                }}>
                  削除済み ({new Date(post.deletedAt!).toLocaleString('ja-JP')})
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <AdminUserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />
                  <div>
                    <AdminUserNameLink userId={post.user.ID}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{post.user.name}</div>
                    </AdminUserNameLink>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>@{post.user.accountID}</div>
                  </div>
                </div>

                {!isDeleted && (
                  <button
                    onClick={handleMainDelete}
                    style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--color-danger)' }}
                  >削除</button>
                )}
              </div>

              {post.content && (
                <p style={{ margin: '0 0 0.75rem', color: isDeleted ? 'var(--color-text-muted)' : 'var(--color-text)', fontSize: '1.1rem', lineHeight: 1.7, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>
              )}

              {post.media && post.media.length > 0 && (
                <PostMediaDetail media={post.media} />
              )}

              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {new Date(post.createdAt).toLocaleString('ja-JP')}
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1.2rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>
                  💬 <strong>{post.replyCount}</strong> 件の返信
                </span>
                <div style={{ pointerEvents: 'none' }}>
                  <LikeButton post={post} currentUserId={null} onLike={async () => { }} large />
                </div>
              </div>
            </div>

            {/* 🛡 返信一覧 */}
            {post.replies.length > 0 && (
              <div>
                {post.replies.map((reply) => (
                  <AdminPostCard
                    key={reply.ID}
                    post={reply}
                    onDelete={handleReplyDelete}
                    isDetail={true}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
