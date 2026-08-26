import { type RefObject } from 'react';
import { PostCard } from './PostCard';
import { type Post } from '../../api/post';
import styles from './ScrollablePostsList.module.css';

type Props = {
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  error: boolean;
  currentUserId: string | null | undefined;
  sentinelRef: RefObject<HTMLDivElement | null>;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onPostClick: (postId: string) => void;
  onReply?: (post: Post) => void;
  onBlock?: (userId: string) => void;
  onReport?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  emptyMessage?: string;
  errorMessage?: string;
};

export const ScrollablePostsList = ({
  posts,
  loading,
  loadingMore,
  error,
  currentUserId,
  sentinelRef,
  onLike,
  onPostClick,
  onReply,
  onBlock,
  onReport,
  onEdit,
  onDelete,
  emptyMessage = '投稿がまだありません',
  errorMessage = '投稿の読み込みに失敗しました',
}: Props) => (
  <div>
    {error && <p className={styles.errorText}>{errorMessage}</p>}
    {loading ? (
      <p className={styles.statusText}>読み込み中...</p>
    ) : posts.length > 0 ? (
      <>
        {posts.map((post) => (
          <PostCard
            key={post.ID}
            post={post}
            currentUserId={currentUserId ?? null}
            onLike={onLike}
            onClick={() => onPostClick(post.ID)}
            onReply={onReply ? () => onReply(post) : undefined}
            onBlock={onBlock}
            onReport={onReport}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        <div ref={sentinelRef} style={{ height: '1px' }} />
        {loadingMore && (
          <p className={styles.statusTextCompact}>読み込み中...</p>
        )}
      </>
    ) : (
      <p className={styles.statusText}>{emptyMessage}</p>
    )}
  </div>
);
