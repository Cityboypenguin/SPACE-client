import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { CommunitySettingsModal } from '../components/organisms/CommunitySettingsModal';
import { ChatMessageBubble } from '../components/molecules/ChatMessageBubble';
import { ChatInput } from '../components/molecules/ChatInput';
import { sendMessage, updateMessage, deleteMessage } from '../api/message';
import {
  listMyCommunities,
  getMyRoleInCommunity,
  type Community,
} from '../api/community';
import { useAuth } from '../context/AuthContext';
import { useRoomMessages } from '../hooks/useRoomMessages';
import styles from '../components/organisms/chatRoom.module.css';

export const CommunityRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: currentUserID } = useAuth();
  const { room, messages, wsConnected, error, addMessage } = useRoomMessages(roomId);

  const [community, setCommunity] = useState<Community | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && error.includes('not a member of this room')) {
      navigate('/community', { replace: true });
    }
  }, [error, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!roomId) return;

    const stateID = (location.state as { communityID?: string } | null)?.communityID;

    const resolveCommunity = async () => {
      let communityID = stateID;
      if (!communityID) {
        try {
          const communities = await listMyCommunities();
          const found = communities.find((c) => c.roomID === roomId);
          if (found) communityID = found.ID;
          if (found) setCommunity(found);
        } catch {
          return;
        }
      } else {
        try {
          const communities = await listMyCommunities();
          const found = communities.find((c) => c.ID === communityID);
          if (found) setCommunity(found);
        } catch {
          // ignore
        }
      }

      if (!communityID) return;
      try {
        const role = await getMyRoleInCommunity(communityID);
        setIsOwner(role === 'owner');
      } catch {
        setIsOwner(false);
      }
    };

    resolveCommunity();
  }, [roomId, location.state]);

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

  return (
    <div className={styles.container}>
      <UserHeader />

      <div className={styles.roomHeader}>
        <button className={styles.backButton} onClick={() => navigate('/community')}>← 戻る</button>
        <strong className={styles.roomTitle}>{room?.name || '...'}</strong>
        {isOwner && (
          <button
            onClick={() => setShowSettings(true)}
            style={{
              marginLeft: '0.5rem',
              padding: '3px 10px',
              fontSize: '0.8rem',
              borderRadius: 6,
              border: '1px solid #a78bfa',
              background: '#fff',
              color: '#7c3aed',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ⚙ 設定
          </button>
        )}
        <span
          className={`${styles.wsIndicator} ${wsConnected ? styles.wsConnected : styles.wsDisconnected}`}
          title={wsConnected ? '接続中' : '切断'}
        />
      </div>

      <div className={styles.messageList}>
        {(error || sendError) && <p style={{ color: 'red' }}>{error || sendError}</p>}

        {messages.map((msg) => {
          const isMine = msg.user.ID === currentUserID;
          const canDelete = isMine || isOwner;
          return (
            <ChatMessageBubble
              key={msg.ID}
              msg={msg}
              isMine={isMine}
              canDelete={canDelete}
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

      {showSettings && community && (
        <CommunitySettingsModal
          community={community}
          onClose={() => setShowSettings(false)}
          onUpdated={(updated) => setCommunity(updated)}
        />
      )}
    </div>
  );
};
