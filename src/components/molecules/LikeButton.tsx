import { useState } from 'react';
import likeIcon from '../../assets/パーツ_いいね.svg';
import styles from './LikeButton.module.css';

type LikeablePost = {
  ID: string;
  favorites: { user: { ID: string } }[];
};

type Props = {
  post: LikeablePost;
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
      className={styles.button}
      style={{ cursor: currentUserId ? 'pointer' : 'default' }}
    >
      <img
        src={likeIcon}
        alt="いいね"
        className={styles.icon}
        style={{
          width: iconSize,
          height: iconSize,
          filter: isLiked
            ? 'brightness(0) invert(42%) sepia(100%) saturate(2000%) hue-rotate(325deg)'
            : 'opacity(0.35)',
        }}
      />
      <span
        className={isLiked ? styles.countLiked : styles.countDefault}
        style={{ fontSize: large ? '0.95rem' : '0.9rem' }}
      >
        {large ? <strong>{post.favorites.length}</strong> : post.favorites.length}
        {large && <span className={styles.suffix}>いいね</span>}
      </span>
    </button>
  );
};
