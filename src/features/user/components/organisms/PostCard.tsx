import { UserAvatar } from '../../../../components/atoms/UserAvatar';
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
    <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <UserMeta
        name={post.user.name}
        accountID={post.user.accountID}
        timestamp={formatTime(post.createdAt)}
      />
      {post.content && (
        <p style={{ margin: '0 0 0.5rem', color: '#1e293b', lineHeight: 1.6, wordBreak: 'break-word' }}>
          {post.content}
        </p>
      )}
      {post.media && post.media.length > 0 && (
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: '0.5rem' }}
          onClick={(e) => e.stopPropagation()}
        >
          {post.media.map((m) =>
            m.contentType.startsWith('image/') ? (
              <img
                key={m.ID}
                src={m.url}
                alt="添付画像"
                style={{
                  maxWidth: 200,
                  maxHeight: 200,
                  borderRadius: 8,
                  objectFit: 'cover',
                  cursor: 'pointer',
                }}
                onClick={() => window.open(m.url, '_blank')}
              />
            ) : (
              <a
                key={m.ID}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  color: '#374151',
                  textDecoration: 'none',
                }}
              >
                📎 {m.contentType.split('/')[1]?.toUpperCase() ?? 'ファイル'}
              </a>
            ),
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
        <span style={{ color: '#94a3b8' }}>💬 {post.replies.length}</span>
        <LikeButton post={post} currentUserId={currentUserId} onLike={onLike} />
      </div>
    </div>
  </div>
);
