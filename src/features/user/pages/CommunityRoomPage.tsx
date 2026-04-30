import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { listMessages, sendMessage, getRoom, type Message } from '../api/message';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';
import { USER_ID_KEY } from '../api/auth';

const MESSAGE_ADDED_SUBSCRIPTION = `
  subscription MessageAdded($roomID: ID!) {
    messageAdded(roomID: $roomID) {
      ID
      roomID
      accountID
      user {
        ID
        name
        accountID
      }
      content
      createdAt
    }
  }
`;

type MessageAddedData = {
  messageAdded: Message;
};
import { sendMessage } from '../api/message';
import { useAuth } from '../context/AuthContext';
import { useRoomMessages } from '../hooks/useRoomMessages';
import styles from '../components/chatRoom.module.css';

export const CommunityRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { userId: currentUserID } = useAuth();
  const { room, messages, wsConnected, error, addMessage } = useRoomMessages(roomId);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserAccountID = localStorage.getItem(USER_ID_KEY) ?? '';

  useEffect(() => {
    if (!roomId) return;
    let active = true;

    const load = async () => {
      try {
        const [roomData, msgData] = await Promise.all([
          getRoom(roomId),
          listMessages(roomId),
        ]);
        if (!active) return;
        setRoomName(roomData.room.name);
        setMessages(msgData.messages);
      } catch (err) {
        if (active) setError('読み込みに失敗しました');
        console.error(err);
      }
    };
    void load();
    return () => { active = false; };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToGraphQL<MessageAddedData>(
      MESSAGE_ADDED_SUBSCRIPTION,
      { roomID: roomId },
      (data) => {
        setWsConnected(true);
        const newMsg = data.messageAdded;
        setMessages((prev) =>
          prev.some((m) => m.ID === newMsg.ID) ? prev : [...prev, newMsg],
        );
      },
      () => setWsConnected(false),
      () => setWsConnected(true),
    );

    return () => {
      unsubscribe();
      setWsConnected(false);
    };
  }, [roomId]);

  const isCurrentUser = (user: { ID: string; userID: string }) =>
    currentUserID != null && (user.ID === currentUserID || user.userID === currentUserID);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!content.trim() || !roomId) return;
    setSending(true);
    setSendError('');
    try {
      const data = await sendMessage(roomId, content.trim());
      setContent('');
      addMessage(data.sendMessage);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.container}>
      <UserHeader />

      <div className={styles.roomHeader}>
        <button className={styles.backButton} onClick={() => navigate('/community')}>← 戻る</button>
        <strong className={styles.roomTitle}>{room?.name || '...'}</strong>
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
