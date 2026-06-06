import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
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

export const AdminPostCard = ({ post, isDetail = false }: Props) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (!isDetail) {
      navigate(`/admin/posts/${post.ID}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        display: 'flex', gap: '0.75rem', padding: '1rem',
        borderBottom: '1px solid #e2e8f0',
        cursor: isDetail ? 'default' : 'pointer',
        background: '#fff', transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (!isDetail) e.currentTarget.style.background = '#f8faff' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
    >
      <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <UserMeta name={post.user.name} accountID={post.user.accountID} timestamp={formatTime(post.createdAt)} />

        {post.content && (
          <p style={{ margin: '0 0 0.5rem', color: '#1e293b', lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
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

          {/* ⭕️ 修正：LikeButton を配置し、管理者は操作できないようポインターイベントを無効化する */}
          <div style={{ pointerEvents: 'none' }}>
            <LikeButton post={post} currentUserId={null} onLike={async () => { }} />
          </div>
        </div>
      </div>
    </div>
  );
};