import { useNavigate } from 'react-router-dom';
import { AdminUserAvatar } from '../../../../components/atoms/AdminUserAvatar';
import { UserMeta } from '../../../user/components/molecules/UserMeta';
import { PostMediaGrid } from '../../../user/components/molecules/PostMediaGrid';
import { LikeButton } from '../../../user/components/molecules/LikeButton';
import { formatTime } from '../../../user/utils/formatTime';
import { type Post } from '../../api/posts';

type Props = {
  post: Post;
  onDelete: (id: string) => Promise<void>;
  isDetail?: boolean;
};

export const AdminPostCard = ({ post }: Props) => {
  const navigate = useNavigate();
  const isDeleted = post.deletedAt != null;

  const handleCardClick = () => {
    navigate(`/admin/posts/${post.ID}`);
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        display: 'flex', gap: '0.75rem', padding: '1rem',
        borderBottom: '1px solid #e2e8f0',
        cursor: 'pointer',
        background: isDeleted ? '#fef2f2' : '#fff',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = isDeleted ? '#fee2e2' : '#f8faff' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = isDeleted ? '#fef2f2' : '#fff' }}
    >
      <AdminUserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <UserMeta name={post.user.name} accountID={post.user.accountID} timestamp={formatTime(post.createdAt)} />

          {isDeleted && (
            <span style={{
              background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold',
              padding: '0.15rem 0.4rem', borderRadius: '4px', whiteSpace: 'nowrap'
            }}>
              削除済み
            </span>
          )}
        </div>

        {post.content && (
          <p style={{ margin: '0.25rem 0 0.5rem', color: isDeleted ? '#64748b' : '#1e293b', lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {post.content}
          </p>
        )}

        {post.media && post.media.length > 0 && (
          <div style={{ marginBottom: '0.5rem' }}>
            <PostMediaGrid media={post.media} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1.2rem', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8' }}>💬 {post.replyCount}</span>

          <div style={{ pointerEvents: 'none' }}>
            <LikeButton post={post} currentUserId={null} onLike={async () => { }} />
          </div>
        </div>
      </div>
    </div>
  );
};