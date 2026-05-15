import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Message, type Media } from '../../api/message';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { storageUrl } from '../../../../lib/storage';
import styles from '../organisms/chatRoom.module.css';

const getFileIcon = (contentType: string): string => {
  if (contentType === 'application/pdf') return '📄';
  if (contentType.includes('word')) return '📝';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
  if (contentType.includes('zip') || contentType.includes('compressed')) return '🗜️';
  if (contentType.startsWith('video/')) return '🎥';
  if (contentType.startsWith('audio/')) return '🎵';
  return '📎';
};

const ImageLightbox = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div
    onClick={onClose}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, cursor: 'zoom-out',
    }}
  >
    <button
      onClick={onClose}
      style={{
        position: 'absolute', top: 16, right: 20,
        background: 'none', border: 'none', color: '#fff',
        fontSize: '2rem', cursor: 'pointer', lineHeight: 1,
      }}
    >✕</button>
    <img
      src={url} alt="拡大表示"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
    />
  </div>
);

const MediaList = ({ mediaItems, isMine }: { mediaItems: Media[]; isMine: boolean }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const images = mediaItems.filter((m) => m.contentType.startsWith('image/'));
  const files = mediaItems.filter((m) => !m.contentType.startsWith('image/'));

  return (
    <>
      {images.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 3,
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          maxWidth: images.length === 1 ? 200 : 160,
        }}>
          {images.map((m) => {
            const url = storageUrl(m.url);
            return (
              <img
                key={m.ID}
                src={url}
                alt="添付画像"
                onClick={() => setLightboxUrl(url)}
                style={{
                  width: images.length === 1 ? '100%' : 76,
                  height: images.length === 1 ? 'auto' : 76,
                  maxWidth: images.length === 1 ? 200 : 76,
                  maxHeight: images.length === 1 ? 200 : 76,
                  objectFit: 'cover',
                  borderRadius: 8,
                  cursor: 'zoom-in',
                  display: 'block',
                }}
              />
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
          {files.map((m) => (
            <a
              key={m.ID}
              href={storageUrl(m.url)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px',
                background: isMine ? '#dbeafe' : '#f3f4f6',
                border: `1px solid ${isMine ? '#bfdbfe' : '#e5e7eb'}`,
                borderRadius: 8,
                fontSize: '0.78rem', color: '#374151',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '1rem' }}>{getFileIcon(m.contentType)}</span>
                <span>{m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
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
};

export const ChatMessageBubble = ({
  msg, isMine, canDelete, isEditing,
  editContent, onStartEdit, onSaveEdit, onCancelEdit,
  onEditContentChange, onDelete,
}: Props) => {
  const navigate = useNavigate();

  const hasText = msg.content.trim() !== '';
  const hasMedia = msg.media && msg.media.length > 0;

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
              <button className={styles.actionBtn} onClick={onStartEdit} title="編集">✎</button>
            )}
            {canDelete && (
              <button className={styles.actionBtn} onClick={onDelete} title="削除">✕</button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
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
              {hasMedia && <MediaList mediaItems={msg.media} isMine={isMine} />}
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
      <UserAvatar userId={msg.user.ID} name={msg.user.name} avatarUrl={msg.user.avatarUrl} size={32} />
      <div className={styles.theirContent}>{bubbleContent}</div>
    </div>
  );
};
