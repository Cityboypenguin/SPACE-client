import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { LikeButton } from '../../../../components/molecules/LikeButton';
import { UserMeta } from '../../../../components/molecules/UserMeta';
import { PostMediaGrid } from '../../../../components/molecules/PostMediaGrid';
import { formatTime } from '../../../../lib/formatTime';
import { type Post } from '../../api/post';
import commentIcon from '../../../../assets/パーツ_コメント.svg';
import styles from './PostCard.module.css';

type Props = {
  post: Post;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onClick: () => void;
  onReply?: () => void;
};

export const PostCard = ({ post, currentUserId, onLike, onClick, onReply }: Props) => (
  <div className={styles.card} onClick={onClick}>
    <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />
    <div className={styles.body}>
      <UserMeta name={post.user.name} accountID={post.user.accountID} timestamp={formatTime(post.createdAt)} />
      {post.content && <p className={styles.content}>{post.content}</p>}
      {post.media && post.media.length > 0 && (
        <div className={styles.mediaWrapper}>
          <PostMediaGrid media={post.media} />
        </div>
      )}
      <div className={styles.actions}>
        <button
          className={styles.replyButton}
          style={{ cursor: onReply ? 'pointer' : 'default' }}
          onClick={(e) => { e.stopPropagation(); onReply?.(); }}
        >
          <img src={commentIcon} alt="返信" className={styles.commentIcon} />
          {post.replyCount}
        </button>
        <LikeButton post={post} currentUserId={currentUserId} onLike={onLike} />
      </div>
    </div>
  </div>
);
