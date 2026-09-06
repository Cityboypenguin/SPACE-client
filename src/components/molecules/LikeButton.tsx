import { useState } from 'react';
import likeIconOff from '../../assets/パーツ_いいね.svg';
import likeIconOn from '../../assets/パーツ_いいね（済）.svg';
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
        src={isLiked ? likeIconOn : likeIconOff}
        alt="いいね"
        className={styles.icon}
        style={{
          width: iconSize,
          height: iconSize,
          filter: isLiked ? 'none' 
            : 'opacity(0.45)',
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
