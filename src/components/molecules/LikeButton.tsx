import { useState } from 'react';
import likeIconOff from '../../assets/パーツ_いいね.svg';
import likeIconOn from '../../assets/パーツ_いいね（済）.svg';
import { useTheme } from '../../context/useTheme';
import styles from './LikeButton.module.css';

type LikeablePost = {
  ID: string;
  // 件数と自分の有無はサーバーが直接返す。以前はいいね行の配列を受け取って
  // length と some() で同じ2つを出していたが、表示に使うのはこの2つだけで、
  // 配列そのものはどこにも出していなかった。
  favoriteCount: number;
  isFavoritedByMe: boolean;
};

type Props = {
  post: LikeablePost;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  large?: boolean;
  // 件数を押したときの動作。渡したときだけ件数がアイコンと別のボタンになる
  //（自分の投稿で「いいねした人」を開くため）。渡さなければ従来どおり、
  // アイコンも件数も押すといいねが切り替わる1つのボタンのままにする。
  onCountClick?: () => void;
};

export const LikeButton = ({ post, currentUserId, onLike, large, onCountClick }: Props) => {
  const isLiked = post.isFavoritedByMe;
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

  const icon = (
    <img
      src={isLiked ? likeIconOn : likeIconOff}
      alt="いいね"
      className={`${styles.icon} ${large ? styles.iconLarge : styles.iconDefault} ${isLiked ? '' : theme === 'dark' ? styles.iconInactiveDark : styles.iconInactive}`}
    />
  );

  const count = (
    <span
      className={`${isLiked ? styles.countLiked : styles.countDefault} ${large ? styles.countLarge : styles.countSmall}`}
    >
      {large ? <strong>{post.favoriteCount}</strong> : post.favoriteCount}
      {large && <span className={styles.suffix}>いいね</span>}
    </span>
  );

  if (!onCountClick) {
    return (
      <button
        onClick={handle}
        disabled={liking || !currentUserId}
        className={styles.button}
      >
        {icon}
        {count}
      </button>
    );
  }

  // ボタンは入れ子にできないので、2つ並べて元と同じ見た目の1かたまりにする。
  return (
    <span className={styles.group}>
      <button
        onClick={handle}
        disabled={liking || !currentUserId}
        className={styles.button}
        aria-label="いいね"
      >
        {icon}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onCountClick(); }}
        className={`${styles.button} ${styles.countButton}`}
      >
        {count}
      </button>
    </span>
  );
};
