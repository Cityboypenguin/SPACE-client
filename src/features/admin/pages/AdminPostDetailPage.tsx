import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminPostCard } from '../components/organisms/AdminPostCard';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../components/atoms/UserNameLink';
import { LikeButton } from '../../../components/molecules/LikeButton';
import { getPostByID, adminDeletePost, type Post, type Media } from '../api/posts';
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
      <main className={styles.feedPage}>
        <div className={styles.postDetailHeader}>
          <button
            onClick={() => navigate(-1)}
          ><ChevronLeft /></button>
          <h1 className={styles.postDetailTitle}>投稿詳細 (管理者)</h1>
        </div>

        {error && <p className={styles.errorPadded}>{error}</p>}

        {loading ? (
          <p className={styles.emptyState}>読み込み中...</p>
        ) : !post ? (
          <p className={styles.emptyState}>投稿が見つかりません</p>
        ) : (
          <>
            {post.rootPost && (
              <div className={styles.rootPostPreview}>
                <AdminPostCard
                  post={post.rootPost}
                  isDetail={false}
                  onDelete={async () => { }}
                />
              </div>
            )}

            <div className={styles.adminPostDetailCard} data-deleted={isDeleted}>

              {isDeleted && (
                <div className={styles.deletedBadge}>
                  削除済み ({new Date(post.deletedAt!).toLocaleString('ja-JP')})
                </div>
              )}

              <div className={styles.postAuthorHeader}>
                <div className={styles.authorRow}>
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
                      <div className={styles.authorName}>{post.user.name}</div>
                    </UserNameLink>
                    <div className={styles.authorAccount}>@{post.user.accountID}</div>
                  </div>
                </div>

                {!isDeleted && (
                  <button
                    onClick={handleMainDelete}
                    className={styles.textDangerButton}
                  >削除</button>
                )}
              </div>

              {post.content && (
                <p className={styles.adminPostContent}>
                  {post.content}
                </p>
              )}

              {post.media && post.media.length > 0 && (
                <PostMediaDetail media={post.media} />
              )}

              <div className={styles.postTimestamp}>
                {new Date(post.createdAt).toLocaleString('ja-JP')}
              </div>

              <div className={styles.postActions}>
                <span className={styles.replySummary}>
                  💬 <strong>{post.replyCount}</strong> 件の返信
                </span>
                <div className={styles.disabledPointer}>
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
