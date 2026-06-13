import { type RefObject } from 'react';
import { PostCard } from './PostCard';
import { type Post } from '../../api/post';

type Props = {
  posts: Post[];
  loading: boolean;
  loadingMore: boolean;
  error: boolean;
  currentUserId: string | null | undefined;
  sentinelRef: RefObject<HTMLDivElement | null>;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onPostClick: (postId: string) => void;
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
  emptyMessage = '投稿がまだありません',
  errorMessage = '投稿の読み込みに失敗しました',
}: Props) => (
  <div>
    {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{errorMessage}</p>}
    <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
      {loading ? (
        <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>
      ) : posts.length > 0 ? (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.ID}
              post={post}
              currentUserId={currentUserId ?? null}
              onLike={onLike}
              onClick={() => onPostClick(post.ID)}
            />
          ))}
          <div ref={sentinelRef} style={{ height: '1px' }} />
          {loadingMore && (
            <p style={{ color: '#94a3b8', padding: '1rem', textAlign: 'center' }}>読み込み中...</p>
          )}
        </>
      ) : (
        <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>{emptyMessage}</p>
      )}
    </div>
  </div>
);
