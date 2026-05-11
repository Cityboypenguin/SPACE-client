import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Message } from '../../api/message';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import styles from '../organisms/chatRoom.module.css';

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const getFileIcon = (url: string): string => {
  const lower = url.toLowerCase();
  if (lower.includes('.pdf')) return '📄';
  if (lower.match(/\.(doc|docx)$/)) return '📝';
  if (lower.match(/\.(xls|xlsx)$/)) return '📊';
  if (lower.match(/\.(zip|tar|gz)$/)) return '🗜️';
  if (lower.match(/\.(mp4|mov|avi)$/)) return '🎥';
  if (lower.match(/\.(mp3|wav|aac)$/)) return '🎵';
  return '📎';
};

const ImageLightbox = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      cursor: 'zoom-out',
    }}
  >
    <button
      onClick={onClose}
      style={{
        position: 'absolute',
        top: 16,
        right: 20,
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: '2rem',
        cursor: 'pointer',
        lineHeight: 1,
      }}
    >
      ✕
    </button>
    <img
      src={url}
      alt="拡大表示"
      onClick={(e) => e.stopPropagation()}
      style={{
        maxWidth: '90vw',
        maxHeight: '90vh',
        objectFit: 'contain',
        borderRadius: 8,
        cursor: 'default',
      }}
    />
  </div>
);

const AttachmentPreview = ({ url, name, isMine }: { url: string; name?: string | null; isMine: boolean }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isImage = IMAGE_EXTS.some((ext) => url.toLowerCase().includes(ext));

  if (isImage) {
    return (
      <>
        <img
          src={url}
          alt="添付画像"
          onClick={() => setLightboxOpen(true)}
          style={{
            display: 'block',
            maxWidth: 240,
            maxHeight: 320,
            borderRadius: 12,
            cursor: 'zoom-in',
            objectFit: 'cover',
            marginLeft: isMine ? 'auto' : 0,
          }}
        />
        {lightboxOpen && (
          <ImageLightbox url={url} onClose={() => setLightboxOpen(false)} />
        )}
      </>
    );
  }

  const filename = name ?? decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? 'ファイル');
  const icon = getFileIcon(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block', marginLeft: isMine ? 'auto' : 0 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 12,
          background: isMine ? '#dbeafe' : '#f3f4f6',
          border: `1px solid ${isMine ? '#bfdbfe' : '#e5e7eb'}`,
          maxWidth: 260,
          cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <span style={{ fontSize: '2rem', flexShrink: 0 }}>{icon}</span>
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#1f2937',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {filename}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
            タップして開く
          </div>
        </div>
      </div>
    </a>
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
};

export const ChatMessageBubble = ({
  msg,
  isMine,
  canDelete,
  isEditing,
  editContent,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditContentChange,
  onDelete,
}: Props) => {
  const navigate = useNavigate();

  const hasText = msg.content.trim() !== '';
  const hasAttachment = !!msg.attachmentUrl;

  const bubbleContent = (
    <div className={`${styles.messageBubble} ${isMine ? styles.mine : styles.theirs}`}>
      {!isMine && (
        <span
          className={styles.senderName}
          onClick={() => navigate(`/users/${msg.user.ID}`)}
          style={{ cursor: 'pointer' }}
        >
          {msg.user.name}
        </span>
      )}

      <div className={styles.messageRow}>
        {(isMine || canDelete) && !isEditing && (
          <div className={styles.messageActions}>
            {isMine && (
              <button className={styles.actionBtn} onClick={onStartEdit} title="編集">
                ✎
              </button>
            )}
            {canDelete && (
              <button className={styles.actionBtn} onClick={onDelete} title="削除">
                ✕
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
          {isEditing ? (
            <div className={styles.editWrapper}>
              <input
                className={styles.editInput}
                value={editContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit();
                  if (e.key === 'Escape') onCancelEdit();
                }}
                autoFocus
              />
              <div className={styles.editActions}>
                <button className={styles.editSaveBtn} onClick={onSaveEdit}>保存</button>
                <button className={styles.editCancelBtn} onClick={onCancelEdit}>キャンセル</button>
              </div>
            </div>
          ) : (
            <>
              {hasText && (
                <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                  {msg.content}
                </div>
              )}
              {hasAttachment && (
                <AttachmentPreview url={msg.attachmentUrl!} name={msg.attachmentName} isMine={isMine} />
              )}
            </>
          )}
        </div>
      </div>

      <span className={styles.timestamp}>
        {new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );

  if (isMine) return bubbleContent;

  return (
    <div className={styles.theirRow}>
      <UserAvatar
        userId={msg.user.ID}
        name={msg.user.name}
        avatarUrl={msg.user.avatarUrl}
        size={32}
      />
      <div className={styles.theirContent}>{bubbleContent}</div>
    </div>
  );
};
