import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { listMessages, sendMessage, getRoom, type Message, type Room } from '../api/message';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';
import { USER_ID_KEY } from '../api/auth';
import { saveRecentDM } from '../utils/recentDM';

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

export const DMPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentAccountID = localStorage.getItem(USER_ID_KEY) ?? '';
  const isCurrentUser = (user: { ID: string; accountID: string }) => {
    if (!currentAccountID) return false;
    return user.ID === currentAccountID || user.accountID === currentAccountID;
  };

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
          saveRecentDM({ roomID: roomId, partnerName: partner.name, partnerAccountID: partner.accountID });
        }
      } catch (err) {
        console.error('[DMPage] loadRoom failed:', err);
        setError('ルームの読み込みに失敗しました');
      }
    };

    loadRoom();
  }, [roomId, currentAccountID]);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !roomId || !currentAccountID) return;
    setSending(true);
    setError('');
    try {
      const data = await sendMessage(roomId, content.trim());
      setContent('');
      setMessages((prev) => {
        if (prev.some((m) => m.ID === data.sendMessage.ID)) return prev;
        return [...prev, data.sendMessage];
      });
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : 'メッセージの送信に失敗しました';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const partnerName = room?.user.find((u) => !isCurrentUser(u))?.name ?? 'DM';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <UserHeader />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid #ccc',
        }}
      >
        <button onClick={() => navigate('/dm')} style={{ cursor: 'pointer' }}>
          ← 戻る
        </button>
        <strong style={{ fontSize: '1.1rem' }}>{partnerName}</strong>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: wsConnected ? '#22c55e' : '#9ca3af',
            display: 'inline-block',
            marginLeft: 'auto',
          }}
          title={wsConnected ? '接続中' : '切断'}
        />
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {messages.map((msg) => {
          const isMine =
            msg.accountID === currentAccountID ||
            msg.user.ID === currentAccountID ||
            msg.user.accountID === currentAccountID;
          return (
            <div
              key={msg.ID}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMine ? 'flex-end' : 'flex-start',
              }}
            >
              {!isMine && (
                <span style={{ fontSize: '0.75rem', color: '#888', marginBottom: '2px' }}>
                  {msg.user.name}
                </span>
              )}
              <div
                style={{
                  maxWidth: '70%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '12px',
                  backgroundColor: isMine ? '#646cff' : '#e5e7eb',
                  color: isMine ? '#fff' : '#111',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '2px' }}>
                {new Date(msg.createdAt).toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #ccc',
        }}
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="メッセージを入力..."
          disabled={sending}
          style={{ flex: 1 }}
          autoFocus
        />
        <button type="submit" disabled={sending || !content.trim()}>
          {sending ? '送信中...' : '送信'}
        </button>
      </form>
    </div>
  );
};
