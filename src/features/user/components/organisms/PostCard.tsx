import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { LikeButton } from '../../../../components/molecules/LikeButton';
import { UserMeta } from '../../../../components/molecules/UserMeta';
import { PostMediaGrid } from '../../../../components/molecules/PostMediaGrid';
import { DropdownMenu, DropdownMenuItem } from '../../../../components/molecules/DropdownMenu';
import { type Post } from '../../api/post';
import commentIcon from '../../../../assets/パーツ_コメント.svg';
import redblockIcon from '../../../../assets/パーツ_ブロック（赤）.svg';
import reportIcon from '../../../../assets/パーツ_通報.svg';
import editIcon from '../../../../assets/パーツ_メッセージ編集.svg';
import deleteIcon from '../../../../assets/パーツ_削除.svg';
import { formatTime } from '../../../../lib/formatTime';
import styles from './PostCard.module.css';
import { renderTextWithLinks } from '../../../../lib/renderTextWithLinks';

type Props = {
  post: Post;
  currentUserId: string | null;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onClick: () => void;
  onReply?: () => void;
  onBlock?: (userId: string) => void;
  onReport?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
};

export const PostCard = ({ post, currentUserId, onLike, onClick, onReply, onBlock, onReport, onEdit, onDelete }: Props) => {
  const isOwnPost = post.user.ID === currentUserId;
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const navigate = useNavigate();

  const handleHashtagClick = useCallback((tag: string) => {
    // ホーム(/home)の検索を使ってハッシュタグ検索する。
    navigate(`/home?q=${encodeURIComponent(`#${tag}`)}`);
  }, [navigate]);

  useLayoutEffect(() => {
    if (contentRef.current) {
      setIsClamped(contentRef.current.scrollHeight > contentRef.current.clientHeight);
    }
  }, [post.content]);

  const handleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(true);
  }, []);

  const handleCollapse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(false);
  }, []);

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.avatarWrap}>
      <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />
      </div>
      <div className={styles.body}>
        <div className={styles.header}>
          <UserMeta userId={post.user.ID} name={post.user.name} accountID={post.user.accountID} timestamp={formatTime(post.createdAt)} />
          <DropdownMenu wrapClassName={styles.menuWrap}>
            {(close) => (
              isOwnPost ? (
                <>
                  <DropdownMenuItem icon={editIcon} themedIcon onClick={() => { close(); onEdit?.(post); }}>
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuItem icon={deleteIcon} themedIcon danger onClick={() => { close(); onDelete?.(post.ID); }}>
                    削除
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem icon={redblockIcon} danger onClick={() => { close(); onBlock?.(post.user.ID); }}>
                    ブロック
                  </DropdownMenuItem>
                  <DropdownMenuItem icon={reportIcon} themedIcon onClick={() => { close(); onReport?.(post.ID); }}>
                    通報
                  </DropdownMenuItem>
                </>
              )
            )}
          </DropdownMenu>
        </div>
        {post.content && (
          <div>
            <p
              ref={contentRef}
              className={`${styles.content} ${!expanded ? styles.contentClamped : ''}`}
            >
              {renderTextWithLinks({ text: post.content, onHashtagClick: handleHashtagClick })}
            </p>
            {isClamped && !expanded && (
              <button className={styles.expandButton} onClick={handleExpand}>もっと見る</button>
            )}
            {isClamped && expanded && (
              <button className={styles.expandButton} onClick={handleCollapse}>閉じる</button>
            )}
          </div>
        )}
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
            <img src={commentIcon} alt="返信" className={`${styles.commentIcon} themed-icon`} />
            {post.replyCount}
          </button>
          <LikeButton post={post} currentUserId={currentUserId} onLike={onLike} />
        </div>
      </div>
    </div>
  );
};
