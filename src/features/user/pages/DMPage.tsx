import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { ChatMessageBubble } from '../components/molecules/ChatMessageBubble';
import { ChatInput } from '../components/molecules/ChatInput';
import { ChatDateSeparator } from '../../../components/atoms/ChatDateSeparator';
import { NewMessagesBadge } from '../components/molecules/NewMessagesBadge';
import { useAuth } from '../context/AuthContext';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { useChatActions } from '../hooks/useChatActions';
import { useChatScroll } from '../hooks/useChatScroll';
import { saveRecentDM } from '../utils/recentDM';
import styles from '../components/organisms/chatRoom.module.css';

export const DMPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { userId: currentUserID } = useAuth();
  const { room, messages, wsConnected, error, addMessage, initialLastReadAt, partnerLastReadAt } = useRoomMessages(roomId);
  const isBlocked = room?.isMessagingDisabled ?? false;
  const {
    content, setContent,
    selectedFiles, setSelectedFiles,
    sending,
    sendError,
    editingId, setEditingId,
    editContent, setEditContent,
    handleSend, handleDelete, handleSaveEdit,
  } = useChatActions(roomId, addMessage);

  const { bottomRef, firstUnreadRef, newMessageCount, scrollToLatest } = useChatScroll(messages, currentUserID);

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

  const partnerName = room?.user.find((u) => u.ID !== currentUserID)?.name ?? 'DM';
  const partnerLastReadAtMs = partnerLastReadAt ? new Date(partnerLastReadAt).getTime() : null;

  const lastReadMessageId = (() => {
    if (partnerLastReadAtMs === null) return null;
    let last: string | null = null;
    for (const msg of messages) {
      if (msg.user.ID === currentUserID && new Date(msg.createdAt).getTime() <= partnerLastReadAtMs) {
        last = msg.ID;
      }
    }
    return last;
  })();

  const initialLastReadAtMs = initialLastReadAt ? new Date(initialLastReadAt).getTime() : null;

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

      <div className={styles.messageListWrapper}>
        <div className={styles.messageList}>
          {(error || sendError) && <p style={{ color: 'red' }}>{error || sendError}</p>}

          {messages.map((msg, index) => {
            const isMine = msg.user.ID === currentUserID;
            const prevMsg = index > 0 ? messages[index - 1] : null;

            const msgTimeMs = new Date(msg.createdAt).getTime();
            const prevMsgTimeMs = prevMsg ? new Date(prevMsg.createdAt).getTime() : null;
            const isFirstUnread = !isMine && initialLastReadAtMs !== null
              && msgTimeMs > initialLastReadAtMs
              && (prevMsgTimeMs === null || prevMsgTimeMs <= initialLastReadAtMs);

            const isLastReadByPartner = isMine && msg.ID === lastReadMessageId;

            return (
              <div key={msg.ID} style={{ display: 'contents' }}>
                <ChatDateSeparator
                  currentCreatedAt={msg.createdAt}
                  prevCreatedAt={prevMsg?.createdAt}
                />

                {isFirstUnread && (
                  <div ref={firstUnreadRef} className={styles.unreadSeparator}>
                    未読メッセージ
                  </div>
                )}

                <ChatMessageBubble
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
                  isReadByPartner={isLastReadByPartner}
                />
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <NewMessagesBadge count={newMessageCount} onClick={scrollToLatest} />
      </div>

      {isBlocked && (
        <div style={{
          padding: '12px',
          margin: '0 16px 16px',
          textAlign: 'center',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}>
          ブロック設定により、現在メッセージを送受信できません。
        </div>
      )}

      <ChatInput
        value={content}
        onChange={setContent}
        onSubmit={handleSend}
        onFileSelect={setSelectedFiles}
        selectedFiles={selectedFiles}
        disabled={sending}
        isBlocked={isBlocked}
      />
    </div>
  );
};
