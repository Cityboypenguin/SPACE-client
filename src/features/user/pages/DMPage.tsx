import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { sendMessage, updateMessage, deleteMessage } from '../api/message';
import { useAuth } from '../context/AuthContext';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { saveRecentDM } from '../utils/recentDM';
import styles from '../components/chatRoom.module.css';

export const DMPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { userId: currentUserID } = useAuth();
  const { room, messages, wsConnected, error, addMessage } = useRoomMessages(roomId);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const isCurrentUser = (user: { ID: string }) =>
    currentUserID != null && user.ID === currentUserID;

  useEffect(() => {
    if (!room || !roomId) return;
    const partner = room.user.find((u) => !isCurrentUser(u));
    if (partner) {
      saveRecentDM({ roomID: roomId, partnerName: partner.name, partnerAccountID: partner.accountID });
    }
  }, [room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!content.trim() || !roomId || !currentUserID) return;
    setSending(true);
    setSendError('');
    try {
      const data = await sendMessage(roomId, content.trim());
      setContent('');
      addMessage(data.sendMessage);
    } catch (err) {
      setSendError(err instanceof Error && err.message ? err.message : 'メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!roomId) return;
    try {
      await deleteMessage(roomId, msgId);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'メッセージの削除に失敗しました');
    }
  };

  const startEdit = (msg: { ID: string; content: string }) => {
    setEditingId(msg.ID);
    setEditContent(msg.content);
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!roomId || !editContent.trim()) return;
    try {
      await updateMessage(roomId, msgId, editContent.trim());
      setEditingId(null);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'メッセージの編集に失敗しました');
    }
  };

  const partnerName = room?.user.find((u) => !isCurrentUser(u))?.name ?? 'DM';

  return (
    <div className={styles.container}>
      <UserHeader />

      <div className={styles.roomHeader}>
        <button className={styles.backButton} onClick={() => navigate('/dm')}>← 戻る</button>
        <strong className={styles.roomTitle}>{partnerName}</strong>
        <span
          className={`${styles.wsIndicator} ${wsConnected ? styles.wsConnected : styles.wsDisconnected}`}
          title={wsConnected ? '接続中' : '切断'}
        />
      </div>

      <div className={styles.messageList}>
        {(error || sendError) && <p style={{ color: 'red' }}>{error || sendError}</p>}

        {messages.map((msg) => {
          const isMine = msg.user.ID === currentUserID;
          const isEditing = editingId === msg.ID;
          return (
            <div
              key={msg.ID}
              className={`${styles.messageBubble} ${isMine ? styles.mine : styles.theirs}`}
            >
              {!isMine && <span className={styles.senderName}>{msg.user.name}</span>}
              <div className={styles.messageRow}>
                {isMine && (
                  <div className={styles.messageActions}>
                    <button className={styles.actionBtn} onClick={() => startEdit(msg)} title="編集">✎</button>
                    <button className={styles.actionBtn} onClick={() => handleDelete(msg.ID)} title="削除">✕</button>
                  </div>
                )}
                {isEditing ? (
                  <div className={styles.editWrapper}>
                    <input
                      className={styles.editInput}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(msg.ID);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                    <div className={styles.editActions}>
                      <button className={styles.editSaveBtn} onClick={() => handleSaveEdit(msg.ID)}>保存</button>
                      <button className={styles.editCancelBtn} onClick={() => setEditingId(null)}>キャンセル</button>
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
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className={styles.inputForm}>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="メッセージを入力..."
          disabled={sending}
          className={styles.inputField}
          autoFocus
        />
        <button type="submit" disabled={sending || !content.trim()}>
          {sending ? '送信中...' : '送信'}
        </button>
      </form>
    </div>
  );
};
