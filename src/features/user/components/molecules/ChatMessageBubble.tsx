import { useEffect, useRef, useState } from 'react';
import { ImageLightbox } from '../../../../components/organisms/ImageLightbox';
import { useNavigate, useLocation } from 'react-router-dom';
import editIcon from '../../../../assets/パーツ_メッセージ編集.svg';
import { type Message, type Media } from '../../api/message';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { Avatar } from '../../../../components/atoms/Avatar';
import { storageUrl } from '../../../../lib/storage';
import styles from '../ChatRoom.module.css';

const URL_REGEX = /(https?:\/\/[^\s 《》「」（）、。！？]+)/g;

const renderWithLinks = (text: string) => {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.messageLink}
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      part
    )
  );
};

const getFileIcon = (contentType: string): string => {
  if (contentType.includes('word')) return '📝';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
  if (contentType.includes('zip') || contentType.includes('compressed')) return '🗜️';
  if (contentType.startsWith('video/')) return '🎥';
  if (contentType.startsWith('audio/')) return '🎵';
  return '📎';
};

const MediaList = ({ mediaItems, isMine }: { mediaItems: Media[]; isMine: boolean }) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const images = mediaItems.filter((m) => m.contentType.startsWith('image/'));
  const files = mediaItems.filter((m) => !m.contentType.startsWith('image/'));

  const imageUrls = images.map((m) => storageUrl(m.url));

  return (
    <>
      {images.length > 0 && (
        <div className={[
          styles.messageMediaGrid,
          isMine ? styles.messageMediaGridMine : styles.messageMediaGridTheirs,
          images.length === 1 ? styles.messageMediaGridSingle : styles.messageMediaGridMultiple,
        ].join(' ')}>
          {images.map((m, i) => {
            const url = storageUrl(m.url);
            return (
              <img
                key={m.ID}
                src={url}
                alt="添付画像"
                onClick={() => setActiveImageIndex(i)}
                className={`${styles.messageImageThumb} ${images.length === 1 ? styles.messageImageSingle : ''}`}
              />
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <div className={`${styles.messageFileList} ${isMine ? styles.messageFileListMine : styles.messageFileListTheirs}`}>
          {files.map((m) => (
            <a
              key={m.ID}
              href={storageUrl(m.url)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.messageFileLink}
            >
              <div
                className={`${styles.messageFileChip} ${isMine ? styles.mediaFileChipMine : styles.mediaFileChipTheirs}`}
              >
                <span className={styles.messageFileIcon}>{getFileIcon(m.contentType)}</span>
                <span>{m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {activeImageIndex !== null && (
        <ImageLightbox
          urls={imageUrls}
          initialIndex={activeImageIndex}
          onClose={() => setActiveImageIndex(null)}
        />
      )}
    </>
  );
};

type Props = {
  msg: Message;
  isMine: boolean;
  canDelete: boolean;
  isEditing: boolean;
  editContent: string;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditContentChange: (val: string) => void;
  onDelete: () => void;
  isReadByPartner?: boolean;
  isAnonymousAuthor?: boolean;
};

export const ChatMessageBubble = ({
  msg, isMine, canDelete, isEditing,
  editContent, onStartEdit, onSaveEdit, onCancelEdit,
  onEditContentChange, onDelete, isReadByPartner, isAnonymousAuthor,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const hasText = msg.content.trim() !== '';
  const hasMedia = msg.media && msg.media.length > 0;
  const canEdit = isMine && msg.content.trim() !== '';
  const canShowActions = (canEdit || canDelete) && !isEditing;
  const isEdited = new Date(msg.updatedAt).getTime() !== new Date(msg.createdAt).getTime();

  const [showActions, setShowActions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing || !editTextareaRef.current) return;
    const el = editTextareaRef.current;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [isEditing]);

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    if (!canShowActions) return;
    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => setShowActions(true), 500);
  };

  useEffect(() => {
    if (!showActions) return;
    const handleOutside = (e: Event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [showActions]);

  const bubbleContent = (
    <div className={`${styles.messageBubble} ${isMine ? styles.mine : styles.theirs}`}>
      {!isMine && (
        <span
          className={styles.senderName}
          onClick={isAnonymousAuthor ? undefined : () => navigate(`/users/${msg.user.ID}`, { state: { from: location.pathname } })}
          style={{ cursor: isAnonymousAuthor ? 'default' : 'pointer' }}
        >
          {msg.user.name}
        </span>
      )}

      <div
        ref={wrapperRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={clearLongPressTimer}
        onTouchMove={clearLongPressTimer}
        onTouchCancel={clearLongPressTimer}
        onContextMenu={(e) => { if (canShowActions) e.preventDefault(); }}
        className={`${styles.messageContentWrap} ${isMine ? styles.messageContentMine : styles.messageContentTheirs}`}
      >
        {canShowActions && (
          <div
            className={`${styles.messageActions} ${isMine ? styles.messageActionsLeft : styles.messageActionsRight} ${showActions ? styles.messageActionsVisible : ''}`}
          >
            {canEdit && (
              <button
                className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                onClick={() => { setShowActions(false); onStartEdit(); }}
                title="編集"
              ><img src={editIcon} alt="編集" className={`${styles.actionIcon} themed-icon`} /></button>
            )}
            {canDelete && (
              <button
                className={styles.actionBtn}
                onClick={() => { setShowActions(false); onDelete(); }}
                title="削除"
              >✕</button>
            )}
          </div>
        )}
        {isEditing ? (
          <div className={styles.editWrapper}>
            <textarea
              ref={editTextareaRef}
              className={styles.editInput}
              value={editContent}
              rows={1}
              onChange={(e) => {
                onEditContentChange(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { onCancelEdit(); return; }
                const isTouch = window.matchMedia('(pointer: coarse)').matches;
                if (isTouch) return;
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  onSaveEdit();
                }
              }}
              autoFocus
            />
            <div className={styles.editActions}>
              <button className={styles.editSaveBtn} onClick={onSaveEdit}>保存</button>
              <button className={styles.editCancelBtn} onClick={onCancelEdit}>キャンセル</button>
            </div>
            {hasMedia && (
              <div className={styles.editingMediaWrap}>
                <MediaList mediaItems={msg.media} isMine={isMine} />
              </div>
            )}
          </div>
        ) : (
          <>
            {hasText && (
              <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                {renderWithLinks(msg.content)}
              </div>
            )}
            {hasMedia && <MediaList mediaItems={msg.media} isMine={isMine} />}
          </>
        )}
      </div>

      {isEdited && !isEditing && (
        <span className={styles.editedLabel}>編集済み</span>
      )}
      <span className={styles.timestamp}>
        {new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
      </span>
      {isMine && isReadByPartner && (
        <span className={styles.readReceipt}>既読</span>
      )}
    </div>
  );

  if (isMine) return bubbleContent;

  return (
    <div className={styles.theirRow}>
      {isAnonymousAuthor ? (
        <Avatar name={msg.user.name} size={32} />
      ) : (
        <UserAvatar userId={msg.user.ID} name={msg.user.name} avatarUrl={msg.user.avatarUrl} size={32} />
      )}
      <div className={styles.theirContent}>{bubbleContent}</div>
    </div>
  );
};
