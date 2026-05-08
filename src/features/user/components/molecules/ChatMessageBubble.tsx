import { type Message } from '../../api/message';
import styles from '../organisms/chatRoom.module.css';

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
}: Props) => (
  <div className={`${styles.messageBubble} ${isMine ? styles.mine : styles.theirs}`}>
    {!isMine && <span className={styles.senderName}>{msg.user.name}</span>}
    <div className={styles.messageRow}>
      {(isMine || canDelete) && (
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
            <button className={styles.editSaveBtn} onClick={onSaveEdit}>
              保存
            </button>
            <button className={styles.editCancelBtn} onClick={onCancelEdit}>
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
          {msg.content}
        </div>
      )}
    </div>
    <span className={styles.timestamp}>
      {new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
    </span>
  </div>
);
