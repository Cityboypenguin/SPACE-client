import { useState } from 'react';
import likeIconOff from '../../assets/パーツ_いいね.svg';
import likeIconOn from '../../assets/パーツ_いいね（済）.svg';
import { useTheme } from '../../context/useTheme';
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
  const { theme } = useTheme();

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
      className={styles.button}
    >
      <img
        src={isLiked ? likeIconOn : likeIconOff}
        alt="いいね"
        className={`${styles.icon} ${large ? styles.iconLarge : styles.iconDefault} ${isLiked ? '' : theme === 'dark' ? styles.iconInactiveDark : styles.iconInactive}`}
      />
      <span
        className={`${isLiked ? styles.countLiked : styles.countDefault} ${large ? styles.countLarge : styles.countSmall}`}
      >
        {large ? <strong>{post.favorites.length}</strong> : post.favorites.length}
        {large && <span className={styles.suffix}>いいね</span>}
      </span>
    </button>
  );
};
