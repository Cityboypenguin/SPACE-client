import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { CommunityDetailPanel } from '../components/organisms/CommunityDetailPanel';
import { ChatMessageBubble } from '../components/molecules/ChatMessageBubble';
import { ChatInput } from '../components/molecules/ChatInput';
import { ChatDateSeparator } from '../../../components/atoms/ChatDateSeparator';
import { ChatUnreadSeparator } from '../../../components/atoms/ChatUnreadSeparator';
import { findFirstUnreadIndex, isSameMessageGroup } from '../lib/messageGrouping';
import { NewMessagesBadge } from '../components/molecules/NewMessagesBadge';
import { CommunityAvatar } from '../../../components/atoms/CommunityAvatar';
import { listMyCommunities, getMyRoleInCommunity, leaveCommunity, type Community } from '../api/community';
import { getMentionCandidates } from '../api/message';
import { ReportModal } from '../components/organisms/ReportModal';
import { toUserMessage } from '../../../lib/errorMessages';
import { useAuth } from '../context/useAuth';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { useChatActions } from '../hooks/useChatActions';
import { useChatScroll } from '../hooks/useChatScroll';
import { useScrollRestoreOnPrepend } from '../hooks/useScrollRestoreOnPrepend';
import { useScrollToMessage } from '../hooks/useScrollToMessage';
import { useResetViewportScroll } from '../hooks/useResetViewportScroll';
import { stableCacheOptions, staticCacheOptions } from '../cache/swrOptions';
import { invalidateCommunityMembers } from '../cache/communityMembers';
import styles from '../components/ChatRoom.module.css';
import pageStyles from './CommunityRoomPage.module.css';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { AppSwal } from '../../../lib/swal';

let hardReloadPending = (() => {
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return entry?.type === 'reload';
})();

export const CommunityRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  useResetViewportScroll([roomId]);
  const locationState = location.state as { communityID?: string; community?: Community; showDetail?: boolean } | null;
  const { userId: currentUserID } = useAuth();
  // 返信通知からは ?messageID=... 付きで開かれ、そのメッセージを中心に表示する。
  const [searchParams] = useSearchParams();
  const aroundMessageId = searchParams.get('messageID');
  const { room, messages, error, addMessage, initialLastReadAt, hasMoreBefore, hasMoreAfter, loadingOlder, loadingNewer, loadOlderMessages, loadNewerMessages, pendingScrollId, jumpToMessage, clearPendingScroll } = useRoomMessages(roomId, { aroundMessageId });
  const {
    content, setContent,
    selectedFiles, setSelectedFiles,
    sending,
    sendError,
    editingId, setEditingId,
    editContent, setEditContent,
    replyTarget, setReplyTarget,
    addPendingMention,
    handleSend, handleDelete, handleSaveEdit,
  } = useChatActions(roomId, addMessage);

  const messageListRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  const {
    bottomRef,
    firstUnreadRef,
    newMessageCount,
    isAtBottom,
    scrollToLatest, releaseAutoScroll,
  } = useChatScroll({
    messages,
    containerRef: messageListRef,
    roomId,
    hasMoreAfter,
  });

  const { beginRestore } = useScrollRestoreOnPrepend(messageListRef, messages.length, loadingOlder);

  useScrollToMessage({
    containerRef: messageListRef,
    pendingScrollId,
    onScrolled: clearPendingScroll,
    messageCount: messages.length,
    releaseAutoScroll,
  });

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
    // returnPath からの明示的な指定は、リロード判定より常に優先する
    const fromState = locationState?.showDetail === true;
    if (fromState) return true;

    if (hardReloadPending) {
      hardReloadPending = false;
      if (detailStorageKey) sessionStorage.removeItem(detailStorageKey);
      return false;
    }
    const fromStorage = detailStorageKey ? sessionStorage.getItem(detailStorageKey) === 'true' : false;
    return fromStorage;
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

  const openDetail = () => setShowDetail(true);
  const closeDetail = () => setShowDetail(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const stateCommunity = locationState?.community ?? null;
  const { data: communities, mutate: mutateCommunities } = useSWR(
    stateCommunity ? null : 'my-communities',
    () => listMyCommunities(),
    staticCacheOptions,
  );

  const community = useMemo((): Community | null => {
    if (stateCommunity) return stateCommunity;
    if (!communities || !roomId) return null;
    const stateID = locationState?.communityID;
    if (stateID) return communities.items.find((c) => c.ID === stateID) ?? null;
    return communities.items.find((c) => c.roomID === roomId) ?? null;
  }, [communities, roomId, locationState, stateCommunity]);

  const communityID = community?.ID ?? null;

  const { data: role } = useSWR(
    communityID ? ['community-role', communityID] : null,
    ([, cid]: [string, string]) => getMyRoleInCommunity(cid),
    stableCacheOptions,
  );
  const isOwner = role === 'owner';

  const [mentionPrefix, setMentionPrefix] = useState<string | null>(null);
  const { data: mentionCandidates } = useSWR(
    roomId && mentionPrefix !== null ? ['mention-candidates', roomId, mentionPrefix] : null,
    ([, rid, prefix]: [string, string, string]) => getMentionCandidates(rid, prefix),
    stableCacheOptions,
  );

  const handleLeave = async () => {
    if (!roomId || !currentUserID) return;
    const result = await AppSwal.fire({
      text: 'このコミュニティを退出しますか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    setLeaveError('');
    try {
      await leaveCommunity(roomId, currentUserID);
      // 退出でメンバーが減るので、メンバー一覧のキャッシュを捨てる。
      if (communityID) await invalidateCommunityMembers(communityID);
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
  const firstUnreadIndex = findFirstUnreadIndex(messages, initialLastReadAtMs, (m) => m.user.ID === currentUserID);

  return (
    <div className={styles.container}>
      <UserSidebar />

      <div className={styles.roomHeader}>
        <button onClick={() => navigate('/community')}><ChevronLeft /></button>
        <button
          onClick={() => openDetail()}
          className={styles.roomHeaderButton}
        >
          <CommunityAvatar name={community?.name || room?.name || '?'} src={community?.avatarURL} size={32} />
          <strong className={styles.roomTitle}>{community?.name || room?.name || '...'}</strong>
        </button>
      </div>

      <div className={styles.messageListWrapper}>
        <div className={styles.messageList} ref={messageListRef}>
          <div ref={topSentinelRef} className={styles.scrollSentinel} />
          {loadingOlder && (
            <p className={pageStyles.loadingText}>読み込み中...</p>
          )}
          {(error || sendError) && <p className={pageStyles.errorText}>{error || sendError}</p>}

          {messages.map((msg, index) => {
            const isMine = msg.user.ID === currentUserID;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const nextMsg = index + 1 < messages.length ? messages[index + 1] : null;
            const isFirstUnread = index === firstUnreadIndex;
            // 未読区切り線をまたぐところではまとまりを切る
            const isGroupStart = isFirstUnread || !isSameMessageGroup(prevMsg, msg);
            const isGroupEnd = index + 1 === firstUnreadIndex || !isSameMessageGroup(msg, nextMsg);

            return (
              <Fragment key={msg.ID}>
                <ChatDateSeparator
                  currentCreatedAt={msg.createdAt}
                  prevCreatedAt={prevMsg?.createdAt}
                />
                {isFirstUnread && <ChatUnreadSeparator ref={firstUnreadRef} />}
                <ChatMessageBubble
                  msg={msg}
                  isMine={isMine}
                  canDelete={isMine || isOwner}
                  isEditing={editingId === msg.ID}
                  editContent={editContent}
                  onStartEdit={() => { setEditingId(msg.ID); setEditContent(msg.content); }}
                  onSaveEdit={() => handleSaveEdit(msg.ID, msg.mentions)}
                  onCancelEdit={() => setEditingId(null)}
                  onEditContentChange={setEditContent}
                  onDelete={() => handleDelete(msg.ID)}
                  onReply={() => setReplyTarget(msg)}
                  onJumpToMessage={jumpToMessage}
                  isGroupStart={isGroupStart}
                  isGroupEnd={isGroupEnd}
                />
              </Fragment>
            );
          })}
          <div ref={bottomSentinelRef} className={styles.scrollSentinel} />
          {loadingNewer && (
            <p className={pageStyles.loadingText}>読み込み中...</p>
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
        replyTarget={replyTarget}
        onCancelReply={() => setReplyTarget(null)}
        mentionCandidates={mentionCandidates ?? []}
        onMentionSelect={addPendingMention}
        onMentionQueryChange={setMentionPrefix}
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
