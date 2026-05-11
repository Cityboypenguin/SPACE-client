import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { ChatMessageBubble } from '../components/molecules/ChatMessageBubble';
import { ChatInput } from '../components/molecules/ChatInput';
import { useAuth } from '../context/AuthContext';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { useChatActions } from '../hooks/useChatActions';
import { saveRecentDM } from '../utils/recentDM';
import styles from '../components/organisms/chatRoom.module.css';

export const DMPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { userId: currentUserID } = useAuth();
  const { room, messages, wsConnected, error, addMessage } = useRoomMessages(roomId);
  const {
    content, setContent,
    selectedFile, setSelectedFile,
    sending,
    sendError,
    editingId, setEditingId,
    editContent, setEditContent,
    handleSend, handleDelete, handleSaveEdit,
  } = useChatActions(roomId, addMessage);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room || !roomId) return;
    const partner = room.user.find((u) => u.ID !== currentUserID);
    if (partner) {
      saveRecentDM({ roomID: roomId, partnerName: partner.name, partnerAccountID: partner.accountID });
    }
  }, [room, roomId, currentUserID]);

  useEffect(() => {
    if (error && error.includes('not a member of this room')) {
      navigate('/dm', { replace: true });
    }
  }, [error, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const partnerName = room?.user.find((u) => u.ID !== currentUserID)?.name ?? 'DM';

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
        onFileSelect={setSelectedFile}
        selectedFile={selectedFile}
        disabled={sending}
      />
    </div>
  );
};
