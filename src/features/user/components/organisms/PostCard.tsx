import { Avatar } from '../../../../components/atoms/Avatar';
import { LikeButton } from '../molecules/LikeButton';
import { UserMeta } from '../molecules/UserMeta';
import { formatTime } from '../../utils/formatTime';
import { type Post } from '../../api/post';

type Props = {
  post: Post;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onClick: () => void;
};

export const PostCard = ({ post, currentUserId, onLike, onClick }: Props) => (
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
    <Avatar name={post.user.name} size={44} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <UserMeta
        name={post.user.name}
        accountID={post.user.accountID}
        timestamp={formatTime(post.createdAt)}
      />
      <p style={{ margin: '0 0 0.5rem', color: '#1e293b', lineHeight: 1.6, wordBreak: 'break-word' }}>
        {post.content}
      </p>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
        <span style={{ color: '#94a3b8' }}>💬 {post.replies.length}</span>
        <LikeButton post={post} currentUserId={currentUserId} onLike={onLike} />
      </div>
    </div>
  </div>
);
