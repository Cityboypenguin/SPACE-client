import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminPostCard } from '../components/organisms/AdminPostCard';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../components/atoms/UserNameLink';
import { LikeButton } from '../../../components/molecules/LikeButton';
import { getPostByID, getPostReplies, adminDeletePost, type Post, type Media } from '../api/posts';
import { useToast } from '../../../context/useToast';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { PostMediaGrid } from '../../../components/molecules/PostMediaGrid';
import styles from '../styles/AdminShared.module.css';

const PostMediaDetail = ({ media }: { media: Media[] }) => <PostMediaGrid media={media} large />;

export const AdminPostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const { addToast } = useToast();

  const loadPost = useCallback((postId: string) => {
    setLoading(true);
    setError('');
    getPostByID(postId)
      .then(result => {
        setPost(result);
        setHasMoreReplies((result?.replies?.length ?? 0) >= 50);
      })
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
        replies: (prev.replies ?? []).map(r => r.ID === replyId ? { ...r, deletedAt: new Date().toISOString() } : r)
      } : null);
      addToast('削除しました', 'success');
    } catch {
      addToast('削除に失敗しました', 'error');
    }
  };

  const handleLoadMoreReplies = async () => {
    if (!post || loadingMoreReplies) return;
    setLoadingMoreReplies(true);
    try {
      const next = await getPostReplies(post.ID, 50, post.replies?.length ?? 0);
      setPost(current => current ? { ...current, replies: [...(current.replies ?? []), ...next] } : null);
      setHasMoreReplies(next.length === 50);
    } catch {
      addToast('返信の読み込みに失敗しました', 'error');
    } finally {
      setLoadingMoreReplies(false);
    }
  };

  const isDeleted = post?.deletedAt != null;

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>投稿詳細 (管理者)</h1>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}
        <button
            type="button"
            onClick={() => navigate(-1)}
            className={styles.paginationButton}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft /> 戻る
          </button>
        {loading ? (
          <p className={styles.emptyState}>読み込み中...</p>
        ) : !post ? (
          <p className={styles.emptyState}>投稿が見つかりません</p>
        ) : (
          <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {post.rootPost && (
              <div>
                <AdminPostCard
                  post={post.rootPost}
                  isDetail={false}
                  onDelete={async () => { }}
                />
              </div>
            )}

            {/* 親投稿カード */}
            <div className={styles.tablePanelPlain} style={{ padding: '24px', boxSizing: 'border-box' }}>
              {isDeleted && (
                <div style={{ backgroundColor: '#fff1f2', color: '#9f1239', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid #fecdd3' }}>
                  削除済み ({new Date(post.deletedAt!).toLocaleString('ja-JP')})
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <UserAvatar
                    userId={post.user.ID}
                    name={post.user.name}
                    avatarUrl={post.user.avatarUrl}
                    size={44}
                    basePath="/admin/users"
                    useMyPageForCurrentUser={false}
                  />
                  <div>
                    <UserNameLink
                      userId={post.user.ID}
                      basePath="/admin/users"
                      useMyPageForCurrentUser={false}
                    >
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{post.user.name}</div>
                    </UserNameLink>
                    <div className={styles.cellMuted} style={{ fontSize: '0.85rem' }}>@{post.user.accountID}</div>
                  </div>
                </div>

                {!isDeleted && (
                  <button
                    type="button"
                    onClick={handleMainDelete}
                    className={styles.primaryButton}
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    削除
                  </button>
                )}
              </div>

              {post.content && (
                <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#334155', margin: '0 0 16px 0', whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>
              )}

              {post.media && post.media.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <PostMediaDetail media={post.media} />
                </div>
              )}

              <div className={styles.cellMuted} style={{ fontSize: '0.8rem', marginBottom: '16px' }}>
                {new Date(post.createdAt).toLocaleString('ja-JP')}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <span className={styles.cellMuted} style={{ fontSize: '0.9rem' }}>
                  💬 <strong>{post.replyCount}</strong> 件の返信
                </span>
                <div>
                  <LikeButton post={post} currentUserId={null} onLike={async () => { }} large />
                </div>
              </div>
            </div>

            {/* 返信一覧 */}
            {(post.replies ?? []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(post.replies ?? []).map((reply) => (
                  <AdminPostCard
                    key={reply.ID}
                    post={reply}
                    onDelete={handleReplyDelete}
                    isDetail={true}
                  />
                ))}
              </div>
            )}
            {hasMoreReplies && (
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  className={styles.paginationButton}
                  onClick={() => void handleLoadMoreReplies()}
                  disabled={loadingMoreReplies}
                >
                  {loadingMoreReplies ? '読み込み中...' : 'さらに返信を表示'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
