import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { LikeButton } from '../../../../components/molecules/LikeButton';
import { UserMeta } from '../../../../components/molecules/UserMeta';
import { PostMediaGrid } from '../../../../components/molecules/PostMediaGrid';
import { formatTime } from '../../../../lib/formatTime';
import { type Post } from '../../api/post';
import { countAllReplies } from '../../../../lib/postUtils';
import commentIcon from '../../../../assets/パーツ_コメント.svg';
import styles from './ReplyThread.module.css';

type Props = {
  post: Post;
  depth?: number;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onReply?: (post: Post) => void;
};

export const ReplyThread = ({ post, depth = 0, currentUserId, onLike, onReply }: Props) => {
  const navigate = useNavigate();

  return (
    <div>
      <div className={styles.item} onClick={() => navigate(`/posts/${post.ID}`)}>
        <div className={styles.avatarCol}>
          <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={36} />
          {post.replies.length > 0 && <div className={styles.threadLine} />}
        </div>
        <div className={styles.body} style={{ paddingBottom: post.replies.length > 0 ? '0.5rem' : 0 }}>
          <UserMeta
            name={post.user.name}
            accountID={post.user.accountID}
            timestamp={formatTime(post.createdAt)}
            small
          />
          <p className={styles.content}>{post.content}</p>
          {post.media && post.media.length > 0 && (
            <div className={styles.mediaWrapper}>
              <PostMediaGrid media={post.media} />
            </div>
          )}
          <div className={styles.actions}>
            <button
              className={styles.replyButton}
              onClick={(e) => { e.stopPropagation(); onReply?.(post); }}
            >
              <img src={commentIcon} alt="返信" className={styles.commentIcon} />
              {countAllReplies(post)}
            </button>
            <LikeButton post={post} currentUserId={currentUserId} onLike={onLike} />
          </div>
        </div>
      </div>

      {post.replies.length > 0 && (
        <div
          className={styles.replies}
          style={{ marginLeft: depth === 0 ? '2.75rem' : '2rem' }}
        >
          {post.replies.map((reply) => (
            <ReplyThread
              key={reply.ID}
              post={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              onLike={onLike}
              onReply={onReply}
            />
          ))}
        </div>
      )}

      {depth === 0 && <div className={styles.separator} />}
    </div>
  );
};
