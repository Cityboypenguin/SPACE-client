import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { sendMessage } from '../api/message';
import { useAuth } from '../context/AuthContext';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { saveRecentDM } from '../utils/recentDM';

const MESSAGE_ADDED_SUBSCRIPTION = `
  subscription MessageAdded($roomID: ID!) {
    messageAdded(roomID: $roomID) {
      ID
      roomID
      AcountID
      user {
        ID
        name
        AccountID
      }
      content
      createdAt
    }
  }
`;

type MessageAddedData = {
  messageAdded: Message;
};
import styles from '../components/chatRoom.module.css';

export const DMPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { userId: currentUserID } = useAuth();
  const { room, messages, wsConnected, error, addMessage } = useRoomMessages(roomId);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserAccountID = localStorage.getItem(USER_ID_KEY) ?? '';
  const isCurrentUser = (user: { ID: string; accountID: string }) => {
    if (!currentUserAccountID) return false;
    return user.ID === currentUserAccountID || user.accountID === currentUserAccountID;
  };

  const isCurrentUser = (user: { ID: string; userID: string }) =>
    currentUserID != null && (user.ID === currentUserID || user.userID === currentUserID);

  useEffect(() => {
    if (!roomId) return;

    const loadRoom = async () => {
      try {
        const [roomData, messagesData] = await Promise.all([
          getRoom(roomId),
          listMessages(roomId),
        ]);
        setRoom(roomData.room);
        setMessages(messagesData.messages);

        const partner = roomData.room.user.find((u) => !isCurrentUser(u));
        if (partner) {
          saveRecentDM({ roomID: roomId, partnerName: partner.name, partnerUserID: partner.accountID });
        }
      } catch (err) {
        console.error('[DMPage] loadRoom failed:', err);
        setError('ルームの読み込みに失敗しました');
      }
    };

    loadRoom();
  }, [roomId, currentUserAccountID]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToGraphQL<MessageAddedData>(
      MESSAGE_ADDED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        setWsConnected(true);
        const newMsg = data.messageAdded;
        setMessages((prev) => {
          if (prev.some((m) => m.ID === newMsg.ID)) return prev;
          return [...prev, newMsg];
        });
      },
      () => {
        setWsConnected(false);
      },
      () => {
        setWsConnected(true);
      },
    );

    return () => {
      unsubscribe();
      setWsConnected(false);
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!content.trim() || !roomId || !currentUserAccountID) return;
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
          const isMine =
            msg.user.accountID === currentUserAccountID ||
            msg.user.ID === currentUserAccountID ||
            msg.user.accountID === currentUserAccountID;
          return (
            <div
              key={msg.ID}
              className={`${styles.messageBubble} ${isMine ? styles.mine : styles.theirs}`}
            >
              {!isMine && <span className={styles.senderName}>{msg.user.name}</span>}
              <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                {msg.content}
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
