import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { LikeButton } from '../molecules/LikeButton';
import { UserMeta } from '../molecules/UserMeta';
import { formatTime } from '../../utils/formatTime';
import { type Post } from '../../api/post';

type Props = {
  post: Post;
  depth?: number;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
};

export const ReplyThread = ({ post, depth = 0, currentUserId, onLike }: Props) => {
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
          <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={36} />
          {post.replies.length > 0 && (
            <div style={{ width: 2, flex: 1, background: '#e2e8f0', marginTop: 4 }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingBottom: post.replies.length > 0 ? '0.5rem' : 0 }}>
          <UserMeta
            name={post.user.name}
            accountID={post.user.accountID}
            timestamp={formatTime(post.createdAt)}
            small
          />
          <p
            style={{
              margin: '0 0 0.4rem',
              color: '#1e293b',
              lineHeight: 1.6,
              wordBreak: 'break-word',
              fontSize: '0.95rem',
            }}
          >
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
            <ReplyThread
              key={reply.ID}
              post={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              onLike={onLike}
            />
          ))}
        </div>
      )}

      {depth === 0 && <div style={{ borderBottom: '1px solid #e2e8f0' }} />}
    </div>
  );
};
