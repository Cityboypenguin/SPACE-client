import { useNavigate } from 'react-router-dom';
import { AdminUserAvatar } from '../../../../components/atoms/AdminUserAvatar';
import { UserMeta } from '../../../../components/molecules/UserMeta';
import { PostMediaGrid } from '../../../../components/molecules/PostMediaGrid';
import { LikeButton } from '../../../../components/molecules/LikeButton';
import { formatTime } from '../../../../lib/formatTime';
import { type Post } from '../../api/posts';
import styles from './AdminPostCard.module.css';

type Props = {
  post: Post;
  onDelete: (id: string) => Promise<void>;
  isDetail?: boolean;
};

export const AdminPostCard = ({ post }: Props) => {
  const navigate = useNavigate();
  const isDeleted = post.deletedAt != null;

  return (
    <div
      className={`${styles.card} ${isDeleted ? styles.cardDeleted : ''}`}
      onClick={() => navigate(`/admin/posts/${post.ID}`)}
    >
      <AdminUserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} />
      <div className={styles.body}>
        <div className={styles.bodyHeader}>
          <UserMeta name={post.user.name} accountID={post.user.accountID} timestamp={formatTime(post.createdAt)} />
          {isDeleted && <span className={styles.deletedBadge}>削除済み</span>}
        </div>
        {post.content && (
          <p className={`${styles.content} ${isDeleted ? styles.contentDeleted : styles.contentNormal}`}>
            {post.content}
          </p>
        )}
        {post.media && post.media.length > 0 && (
          <div className={styles.mediaWrapper}>
            <PostMediaGrid media={post.media} />
          </div>
        )}
        <div className={styles.actions}>
          <span className={styles.replyCount}>💬 {post.replyCount}</span>
          <div className={styles.likeWrapper}>
            <LikeButton post={post} currentUserId={null} onLike={async () => { }} />
          </div>
        </div>
      </div>
    </div>
  );
};
