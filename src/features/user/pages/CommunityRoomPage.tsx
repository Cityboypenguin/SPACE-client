import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { CommunitySettingsModal } from '../components/organisms/CommunitySettingsModal';
import { ChatMessageBubble } from '../components/molecules/ChatMessageBubble';
import { ChatInput } from '../components/molecules/ChatInput';
import { ChatDateSeparator } from '../../../components/atoms/ChatDateSeparator';
import { NewMessagesBadge } from '../components/molecules/NewMessagesBadge';
import { listMyCommunities, getMyRoleInCommunity, leaveCommunity, getCommunityMembers, type Community } from '../api/community';
import { createReport } from '../api/report';
import { CommunityMembersModal } from '../components/organisms/CommunityMemberModal';
import { useAuth } from '../context/AuthContext';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { useChatActions } from '../hooks/useChatActions';
import { useChatScroll } from '../hooks/useChatScroll';
import styles from '../components/organisms/chatRoom.module.css';
import { toUserMessage } from '../../../lib/errorMessages';

export const CommunityRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: currentUserID } = useAuth();
  const { room, messages, wsConnected, error, addMessage, initialLastReadAt } = useRoomMessages(roomId);
  const {
    content, setContent,
    selectedFiles, setSelectedFiles,
    sending,
    sendError,
    editingId, setEditingId,
    editContent, setEditContent,
    handleSend, handleDelete, handleSaveEdit,
  } = useChatActions(roomId, addMessage);

  const { bottomRef, firstUnreadRef, newMessageCount, isAtBottom, scrollToLatest } = useChatScroll(messages, currentUserID);

  const [community, setCommunity] = useState<Community | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [reporting, setReporting] = useState(false);

  const handleLeave = async () => {
    if (!roomId || !currentUserID) return;
    if (!window.confirm('このコミュニティを退出しますか？')) return;
    setLeaving(true);
    try {
      await leaveCommunity(roomId, currentUserID);
      navigate('/community', { replace: true });
    } catch {
      setLeaving(false);
    }
  };

  const handleReportCommunity = async () => {
    if (!community) return;

    const reason = window.prompt(
      `コミュニティ「${community.name}」を通報する理由を入力してください。\n(例: 荒らし行為、利用規約違反、不適切なコンテンツなど)`
    );

    if (reason === null) return;
    if (!reason.trim()) {
      window.alert('通報理由は必須です。');
      return;
    }

    setReporting(true);
    try {
      await createReport({
        targetType: 'COMMUNITY',
        targetID: community.ID,
        reason: '違反報告',
        customReason: reason,
      });
      window.alert('コミュニティの通報が完了しました。運営にて確認いたします。');
    } catch (err) {
      window.alert(toUserMessage(err, '通報の送信に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      setReporting(false);
    }
  };

  useEffect(() => {
    if (error && error.includes('not a member of this room')) {
      navigate('/community', { replace: true });
    }
  }, [error, navigate]);

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
        const members = await getCommunityMembers(communityID);
        setMemberCount(members.length);
      } catch {
        setIsOwner(false);
      }
    };

    resolveCommunity();
  }, [roomId, location.state]);

  const initialLastReadAtMs = initialLastReadAt ? new Date(initialLastReadAt).getTime() : null;

  return (
    <div className={styles.container}>
      <UserHeader />

      <div className={styles.roomHeader}>
        <button className={styles.backButton} onClick={() => navigate('/community')}>← 戻る</button>
        <strong className={styles.roomTitle}>{community?.name || room?.name || '...'}</strong>
        {memberCount !== null && (
          <button
            onClick={() => setShowMembers(true)}
            style={{
              marginLeft: '0.6rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '2px 8px',
              borderRadius: 12,
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            {memberCount} 人のメンバー
          </button>
        )}
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
        {community && (
          <button
            onClick={handleReportCommunity}
            disabled={reporting}
            style={{
              marginLeft: 'auto',
              padding: '3px 10px',
              fontSize: '0.8rem',
              borderRadius: 6,
              border: '1px solid #fca5a5',
              background: '#fff',
              color: '#dc2626',
              cursor: reporting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: reporting ? 0.6 : 1,
            }}
          >
            🚩 通報
          </button>
        )}
        <button
          onClick={handleLeave}
          disabled={leaving}
          style={{
            marginLeft: '0.5rem',
            padding: '3px 10px',
            fontSize: '0.8rem',
            borderRadius: 6,
            border: '1px solid #fca5a5',
            background: '#fff',
            color: '#ef4444',
            cursor: leaving ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: leaving ? 0.6 : 1,
          }}
        >
          退出
        </button>
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
                  canDelete={isMine || isOwner}
                  isEditing={editingId === msg.ID}
                  editContent={editContent}
                  onStartEdit={() => { setEditingId(msg.ID); setEditContent(msg.content); }}
                  onSaveEdit={() => handleSaveEdit(msg.ID)}
                  onCancelEdit={() => setEditingId(null)}
                  onEditContentChange={setEditContent}
                  onDelete={() => handleDelete(msg.ID)}
                />
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <NewMessagesBadge count={newMessageCount} isAtBottom={isAtBottom} onClick={scrollToLatest} />
      </div>

      <ChatInput
        value={content}
        onChange={setContent}
        onSubmit={handleSend}
        onFileSelect={setSelectedFiles}
        selectedFiles={selectedFiles}
        disabled={sending}
      />

      {showSettings && community && (
        <CommunitySettingsModal
          community={community}
          onClose={() => setShowSettings(false)}
          onUpdated={(updated) => setCommunity(updated)}
        />
      )}
      {showMembers && community && (
        <CommunityMembersModal
          community={community}
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  );
};
