import { useState } from 'react';
import { type Post } from '../../api/post';

type Props = {
  post: Post;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  large?: boolean;
};

export const LikeButton = ({ post, currentUserId, onLike, large }: Props) => {
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
