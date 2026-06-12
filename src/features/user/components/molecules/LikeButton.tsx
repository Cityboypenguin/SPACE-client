import { useState } from 'react';
import { type Post } from '../../api/post';
import likeIcon from '../../../../assets/パーツ_いいね.svg';

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

  const iconSize = large ? 22 : 20;

  return (
    <button
      onClick={handle}
      disabled={liking || !currentUserId}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: currentUserId ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        transition: 'opacity 0.1s',
      }}
    >
      <img
        src={likeIcon}
        alt="いいね"
        style={{
          width: iconSize,
          height: iconSize,
          filter: isLiked
            ? 'brightness(0) invert(42%) sepia(100%) saturate(2000%) hue-rotate(325deg)'
            : 'opacity(0.35)',
          transition: 'filter 0.15s',
        }}
      />
      <span style={{ color: isLiked ? '#f43f5e' : '#94a3b8', fontWeight: isLiked ? 600 : 400, fontSize: large ? '0.95rem' : '0.9rem' }}>
        {large ? <strong>{post.favorites.length}</strong> : post.favorites.length}
        {large && <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>いいね</span>}
      </span>
    </button>
  );
};
