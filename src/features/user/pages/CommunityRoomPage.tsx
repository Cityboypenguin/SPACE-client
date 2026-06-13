import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { CommunityDetailPanel } from '../components/organisms/CommunityDetailPanel';
import { ChatMessageBubble } from '../components/molecules/ChatMessageBubble';
import { ChatInput } from '../components/molecules/ChatInput';
import { ChatDateSeparator } from '../../../components/atoms/ChatDateSeparator';
import { NewMessagesBadge } from '../components/molecules/NewMessagesBadge';
import { CommunityAvatar } from '../../../components/atoms/CommunityAvatar';
import { listMyCommunities, getMyRoleInCommunity, leaveCommunity, type Community } from '../api/community';
import { ReportModal } from '../components/organisms/ReportMadal';
import { toUserMessage } from '../../../lib/errorMessages';
import { useAuth } from '../context/AuthContext';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { useChatActions } from '../hooks/useChatActions';
import { useChatScroll } from '../hooks/useChatScroll';
import { useScrollRestoreOnPrepend } from '../hooks/useScrollRestoreOnPrepend';
import styles from '../components/organisms/chatRoom.module.css';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';

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

  const messageListRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  const { beginRestore } = useScrollRestoreOnPrepend(messageListRef, messages.length, loadingOlder);

  const loadOlderWithScrollRestore = async () => {
    beginRestore();
    await loadOlderMessages();
  };

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

  const detailStorageKey = roomId ? `showDetail-${roomId}` : null;

  const [showDetail, setShowDetail] = useState(() => {
    const navType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type;
    if (navType === 'reload') {
      if (detailStorageKey) sessionStorage.removeItem(detailStorageKey);
      return false;
    }
    const fromState = (location.state as { showDetail?: boolean } | null)?.showDetail === true;
    const fromStorage = detailStorageKey ? sessionStorage.getItem(detailStorageKey) === 'true' : false;
    return fromState || fromStorage;
  });
  const [leaveError, setLeaveError] = useState('');

  useEffect(() => {
    if (!detailStorageKey) return;
    if (showDetail) {
      sessionStorage.setItem(detailStorageKey, 'true');
    } else {
      sessionStorage.removeItem(detailStorageKey);
    }
  }, [showDetail, detailStorageKey]);

  const openDetail = () => { setShowDetail(true); void mutateCommunities(); };
  const closeDetail = () => setShowDetail(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const { data: communities, mutate: mutateCommunities } = useSWR('my-communities', () => listMyCommunities(), { revalidateOnFocus: false });

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
    { revalidateOnFocus: false },
  );
  const isOwner = role === 'owner';

  const handleLeave = async () => {
    if (!roomId || !currentUserID) return;
    if (!window.confirm('このコミュニティを退出しますか？')) return;
    setLeaveError('');
    try {
      await leaveCommunity(roomId, currentUserID);
      void mutateCommunities();
      navigate('/community', { replace: true });
    } catch (err) {
      setLeaveError(toUserMessage(err, '退出に失敗しました。'));
    }
  };

  useEffect(() => {
    if (error && error.includes('not a member of this room')) {
      navigate('/community', { replace: true });
    }
  }, [error, navigate]);

  const initialLastReadAtMs = initialLastReadAt ? new Date(initialLastReadAt).getTime() : null;

  return (
    <div className={styles.container}>
      <UserSidebar />

      <div className={styles.roomHeader}>
        <button className={styles.backButton} onClick={() => navigate('/community')}><ChevronLeft /></button>
        <button
          onClick={() => openDetail()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, minWidth: 0, flex: 1, overflow: 'hidden' }}
        >
          <CommunityAvatar name={community?.name || room?.name || '?'} src={community?.avatarURL} size={32} />
          <strong className={styles.roomTitle}>{community?.name || room?.name || '...'}</strong>
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

      {showDetail && community && (
        <CommunityDetailPanel
          community={community}
          isOwner={isOwner}
          leaveError={leaveError}
          onClose={() => { closeDetail(); setLeaveError(''); }}
          onLeave={handleLeave}
          onReport={() => { closeDetail(); setLeaveError(''); setIsReportOpen(true); }}
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
