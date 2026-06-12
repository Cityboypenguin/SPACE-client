import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { UserHeader } from '../components/organisms/UserHeader';
import { CommunitySettingsModal } from '../components/organisms/CommunitySettingsModal';
import { ChatMessageBubble } from '../components/molecules/ChatMessageBubble';
import { ChatInput } from '../components/molecules/ChatInput';
import { ChatDateSeparator } from '../../../components/atoms/ChatDateSeparator';
import { NewMessagesBadge } from '../components/molecules/NewMessagesBadge';
import { listMyCommunities, getMyRoleInCommunity, leaveCommunity, getCommunityMembers, type Community } from '../api/community';
import { CommunityMembersModal } from '../components/organisms/CommunityMemberModal';
import { ReportModal } from '../components/organisms/ReportMadal';
import { useAuth } from '../context/AuthContext';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { useChatActions } from '../hooks/useChatActions';
import { useChatScroll } from '../hooks/useChatScroll';
import { useScrollRestoreOnPrepend } from '../hooks/useScrollRestoreOnPrepend';
import styles from '../components/organisms/chatRoom.module.css';
import { toUserMessage } from '../../../lib/errorMessages';

export const CommunityRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: currentUserID } = useAuth();
  const { room, messages, wsConnected, error, addMessage, initialLastReadAt, hasMoreBefore, hasMoreAfter, loadingOlder, loadingNewer, loadOlderMessages, loadNewerMessages } = useRoomMessages(roomId);
  const {
    content, setContent,
    selectedFiles, setSelectedFiles,
    sending,
    sendError,
    editingId, setEditingId,
    editContent, setEditContent,
    handleSend, handleDelete, handleSaveEdit,
  } = useChatActions(roomId, addMessage);

  const { bottomRef, firstUnreadRef, newMessageCount, isAtBottom, scrollToLatest } = useChatScroll(messages, currentUserID, roomId, hasMoreAfter);

  // 双方向スクロールページング
  const messageListRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  const { beginRestore } = useScrollRestoreOnPrepend(messageListRef, messages.length, loadingOlder);

  const loadOlderWithScrollRestore = async () => {
    beginRestore();
    await loadOlderMessages();
  };

  // 上センチネル: 古いメッセージを取得
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = messageListRef.current;
    if (!sentinel || !container || !hasMoreBefore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadOlderWithScrollRestore(); },
      { root: container, rootMargin: '200px 0px 0px 0px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMoreBefore, loadOlderMessages]);

  // 下センチネル: 新しいメッセージを取得（歴史閲覧中のみ active）
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    const container = messageListRef.current;
    if (!sentinel || !container || !hasMoreAfter) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadNewerMessages(); },
      { root: container, rootMargin: '0px 0px 200px 0px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreAfter, loadNewerMessages]);

  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const { data: communities, mutate: mutateCommunities } = useSWR('my-communities', () => listMyCommunities());

  const community = useMemo((): Community | null => {
    if (!communities || !roomId) return null;
    const stateID = (location.state as { communityID?: string } | null)?.communityID;
    if (stateID) return communities.items.find((c) => c.ID === stateID) ?? null;
    return communities.items.find((c) => c.roomID === roomId) ?? null;
  }, [communities, roomId, location.state]);

  const communityID = community?.ID ?? null;

  const { data: role } = useSWR(
    communityID ? ['community-role', communityID] : null,
    ([, cid]: [string, string]) => getMyRoleInCommunity(cid),
  );
  const isOwner = role === 'owner';

  const { data: members } = useSWR(
    communityID ? ['community-members', communityID] : null,
    ([, cid]: [string, string]) => getCommunityMembers(cid),
  );
  const memberCount = members?.length ?? null;

  const handleLeave = async () => {
    if (!roomId || !currentUserID) return;
    if (!window.confirm('このコミュニティを退出しますか？')) return;
    setLeaving(true);
    try {
      await leaveCommunity(roomId, currentUserID);
      void mutateCommunities();
      navigate('/community', { replace: true });
    } catch {
      setLeaving(false);
    }
  };

  const handleReportCommunity = () => {
    if (!community) return;
    setIsReportOpen(true);
  };

  useEffect(() => {
    if (error && error.includes('not a member of this room')) {
      navigate('/community', { replace: true });
    }
  }, [error, navigate]);

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
            style={{
              marginLeft: 'auto',
              padding: '3px 10px',
              fontSize: '0.8rem',
              borderRadius: 6,
              border: '1px solid #fca5a5',
              background: '#fff',
              color: '#dc2626',
              cursor: 'pointer',
              fontWeight: 600,
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
        <div className={styles.messageList} ref={messageListRef}>
          <div ref={topSentinelRef} style={{ height: '1px' }} />
          {loadingOlder && (
            <p style={{ color: '#94a3b8', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>読み込み中...</p>
          )}
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
          <div ref={bottomSentinelRef} style={{ height: '1px' }} />
          {loadingNewer && (
            <p style={{ color: '#94a3b8', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>読み込み中...</p>
          )}
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
          onUpdated={(updated) => {
            mutateCommunities(
              (prev) => prev
                ? {
                    ...prev,
                    items: prev.items.map((c) => c.ID === updated.ID ? { ...c, ...updated } : c),
                  }
                : prev,
              { revalidate: true },
            );
          }}
        />
      )}
      {showMembers && community && (
        <CommunityMembersModal
          community={community}
          onClose={() => setShowMembers(false)}
        />
      )}
      {community && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="COMMUNITY"
          targetID={community.ID}
        />
      )}
    </div>
  );
};
