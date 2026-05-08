import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { ChatMessageBubble } from '../components/molecules/ChatMessageBubble';
import { ChatInput } from '../components/molecules/ChatInput';
import { sendMessage, updateMessage, deleteMessage } from '../api/message';
import { useAuth } from '../context/AuthContext';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { saveRecentDM } from '../utils/recentDM';
import styles from '../components/organisms/chatRoom.module.css';

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
    if (error && error.includes('not a member of this room')) {
      navigate('/dm', { replace: true });
    }
  }, [error, navigate]);

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
          return (
            <ChatMessageBubble
              key={msg.ID}
              msg={msg}
              isMine={isMine}
              canDelete={isMine}
              isEditing={editingId === msg.ID}
              editContent={editContent}
              onStartEdit={() => { setEditingId(msg.ID); setEditContent(msg.content); }}
              onSaveEdit={() => handleSaveEdit(msg.ID)}
              onCancelEdit={() => setEditingId(null)}
              onEditContentChange={setEditContent}
              onDelete={() => handleDelete(msg.ID)}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        value={content}
        onChange={setContent}
        onSubmit={handleSend}
        disabled={sending}
      />
    </div>
  );
};
