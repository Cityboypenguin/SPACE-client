import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { LikeButton } from '../../../../components/molecules/LikeButton';
import { UserMeta } from '../../../../components/molecules/UserMeta';
import { PostMediaGrid } from '../../../../components/molecules/PostMediaGrid';
import { type Post } from '../../api/post';
import commentIcon from '../../../../assets/パーツ_コメント.svg';
import blockIcon from '../../../../assets/パーツ_ブロック.svg';
import reportIcon from '../../../../assets/パーツ_通報.svg';
import editIcon from '../../../../assets/パーツ_メッセージ編集.svg';
import deleteIcon from '../../../../assets/パーツ_削除.svg';
import styles from './PostCard.module.css';

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

const formatTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec}秒前`;
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;

  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}/${m}/${d}`;
};

export const PostCard = ({ post, currentUserId, onLike, onClick, onReply, onBlock, onReport, onEdit, onDelete }: Props) => {
  const isOwnPost = post.user.ID === currentUserId;
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    if (contentRef.current) {
      setIsClamped(contentRef.current.scrollHeight > contentRef.current.clientHeight);
    }
  }, [post.content]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

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
      <UserAvatar userId={post.user.ID} name={post.user.name} avatarUrl={post.user.avatarUrl} size={44} />
      <div className={styles.body}>
        <div className={styles.header}>
          <UserMeta name={post.user.name} accountID={post.user.accountID} timestamp={formatTimestamp(post.createdAt)} />
          <div className={styles.menuWrap} ref={menuRef}>
            <button
              className={styles.menuButton}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
              aria-label="メニュー"
            >
              ···
            </button>
            {menuOpen && (
              <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                {isOwnPost ? (
                  <>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => { setMenuOpen(false); onEdit?.(post); }}
                    >
                      <img src={editIcon} alt="" className={styles.dropdownIcon} />
                      編集
                    </button>
                    <button
                      className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                      onClick={() => { setMenuOpen(false); onDelete?.(post.ID); }}
                    >
                      <img src={deleteIcon} alt="" className={styles.dropdownIconDelete} />
                      削除
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => { setMenuOpen(false); onBlock?.(post.user.ID); }}
                    >
                      <img src={blockIcon} alt="" className={styles.dropdownIcon} />
                      ブロック
                    </button>
                    <button
                      className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                      onClick={() => { setMenuOpen(false); onReport?.(post.ID); }}
                    >
                      <img src={reportIcon} alt="" className={styles.dropdownIcon} />
                      通報
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {post.content && (
          <div>
            <p
              ref={contentRef}
              className={`${styles.content} ${!expanded ? styles.contentClamped : ''}`}
            >
              {post.content}
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
            <img src={commentIcon} alt="返信" className={styles.commentIcon} />
            {post.replyCount}
          </button>
          <LikeButton post={post} currentUserId={currentUserId} onLike={onLike} />
        </div>
      </div>
    </div>
  );
};
