import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { LikeButton } from '../../../../components/molecules/LikeButton';
import { UserMeta } from '../../../../components/molecules/UserMeta';
import { PostMediaGrid } from '../../../../components/molecules/PostMediaGrid';
import { formatTime } from '../../../../lib/formatTime';
import { getPostReplies, type Post } from '../../api/post';
import { countAllReplies } from '../../../../lib/postUtils';
import commentIcon from '../../../../assets/パーツ_コメント.svg';
import styles from './ReplyThread.module.css';
import { renderTextWithLinks } from '../../../../lib/renderTextWithLinks';
import { useMentionNavigation } from '../../hooks/useMentionNavigation';

type Props = {
  post: Post;
  depth?: number;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onReply?: (post: Post) => void;
  replyRefresh?: ReplyRefresh;
};

/** 返信を投稿したとき、どの投稿への返信かを遅延読み込み中の階層へ知らせる */
export type ReplyRefresh = { postID: string; n: number };

const REPLY_PAGE_SIZE = 50;
const INITIAL_REPLY_LIMITS = [10, 3, 2] as const;

type ReplyListProps = Omit<Props, 'post' | 'depth'> & {
  parentID: string;
  initialReplies?: Post[];
  knownReplyCount: number;
  depth?: number;
  nested?: boolean;
};

export const ReplyList = ({
  parentID,
  initialReplies,
  knownReplyCount,
  depth = 0,
  nested = false,
  currentUserId,
  onLike,
  onReply,
  replyRefresh,
}: ReplyListProps) => {
  const visibleInitialReplies = (initialReplies ?? []).filter(reply => reply.user != null && reply.deletedAt == null);
  const [additionalReplies, setAdditionalReplies] = useState<Post[]>([]);
  const [additionalLoadedCount, setAdditionalLoadedCount] = useState(0);
  const initialIDs = new Set(visibleInitialReplies.map(reply => reply.ID));
  const replies = [...visibleInitialReplies, ...additionalReplies.filter(reply => !initialIDs.has(reply.ID))];
  const initialReplyLimit = INITIAL_REPLY_LIMITS[depth];
  const [hasMore, setHasMore] = useState(
    initialReplies == null
      ? knownReplyCount > 0
      : initialReplyLimit != null && initialReplies.length >= initialReplyLimit,
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 返信が投稿されたら、読み込み済みの返信を取り直して即座に表示する。
  // 親の再取得で initialReplies が渡ってくる階層はそれで更新されるので、
  // 遅延読み込みしている階層（initialReplies なし）だけ自分で取り直す。
  // 返信先の階層と、読み込み済みの階層（孫以下の件数を最新にするため）が対象。
  // 裏での取り直しなので読み込み中表示は出さない。
  useEffect(() => {
    if (replyRefresh == null || initialReplies != null) return;
    if (replyRefresh.postID !== parentID && additionalLoadedCount === 0) return;
    let cancelled = false;
    const limit = Math.max(REPLY_PAGE_SIZE, additionalLoadedCount + 1);
    getPostReplies(parentID, limit, 0)
      .then(next => {
        if (cancelled) return;
        setAdditionalReplies(next.filter(reply => reply.user != null && reply.deletedAt == null));
        setAdditionalLoadedCount(next.length);
        setHasMore(next.length === limit);
        setLoadError(false);
      })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyRefresh]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setLoadError(false);
    try {
      const next = await getPostReplies(parentID, REPLY_PAGE_SIZE, (initialReplies?.length ?? 0) + additionalLoadedCount);
      setAdditionalReplies(current => {
        const existing = new Set([...visibleInitialReplies, ...current].map(reply => reply.ID));
        return [...current, ...next.filter(reply => reply.user != null && reply.deletedAt == null && !existing.has(reply.ID))];
      });
      setAdditionalLoadedCount(current => current + next.length);
      setHasMore(next.length === REPLY_PAGE_SIZE);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  if (replies.length === 0 && !hasMore) return null;

  return (
    <div className={nested ? styles.replies : undefined}>
      {replies.map(reply => (
        <ReplyThread
          key={reply.ID}
          post={reply}
          depth={depth}
          currentUserId={currentUserId}
          onLike={onLike}
          onReply={onReply}
          replyRefresh={replyRefresh}
        />
      ))}
      {hasMore && (
        <button type="button" className={styles.loadMoreButton} onClick={() => void loadMore()} disabled={loading}>
          {loading ? '読み込み中...' : replies.length === 0 ? '返信を表示' : 'さらに返信を表示'}
        </button>
      )}
      {loadError && <p className={styles.loadError}>返信を読み込めませんでした</p>}
    </div>
  );
};

export const ReplyThread = ({ post, depth = 0, currentUserId, onLike, onReply, replyRefresh }: Props) => {
  const { onMentionClick } = useMentionNavigation();
  const navigate = useNavigate();
  const replies = (post.replies ?? []).filter(r => r.user != null);
  const hasReplyBranch = replies.length > 0 || (post.replies == null && post.replyCount > 0);

  return (
    <div className={styles.replyWrapper}>
      <div className={`${styles.item}${depth > 0 ? ` ${styles.childItem}` : ''}${hasReplyBranch ? ` ${styles.itemWithReplies}` : ''}`} onClick={() => navigate(`/posts/${post.ID}`)}>

        <div className={styles.avatarCol}>
          <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={36} />
          {hasReplyBranch && <div className={styles.threadLine} />}
        </div>
        <div className={styles.body} style={{ paddingBottom: hasReplyBranch ? '0.5rem' : 0 }}>
          <UserMeta
            userId={post.user.ID}
            name={post.user.name}
            accountID={post.user.accountID}
            timestamp={formatTime(post.createdAt)}
            small
          />
          <p className={styles.content}>
            {renderTextWithLinks({
              text: post.content,
              mentions: post.mentions,
              currentUserID: currentUserId,
              onMentionClick,
            })}
          </p>
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
              <img src={commentIcon} alt="返信" className={`${styles.commentIcon} themed-icon`} />
              {Math.max(countAllReplies(post), post.replyCount)}
            </button>
            <LikeButton post={post} currentUserId={currentUserId} onLike={onLike} />
          </div>
        </div>
      </div>

      <ReplyList
        parentID={post.ID}
        initialReplies={post.replies}
        knownReplyCount={post.replyCount}
        depth={depth + 1}
        nested
        currentUserId={currentUserId}
        onLike={onLike}
        onReply={onReply}
        replyRefresh={replyRefresh}
      />

      {depth === 0 && <div className={styles.separator} />}
    </div>
  );
};
