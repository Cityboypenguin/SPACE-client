import React, { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ChatMessageBubble } from '../components/molecules/ChatMessageBubble';
import { ChatInput } from '../components/molecules/ChatInput';
import { ChatDateSeparator } from '../../../components/atoms/ChatDateSeparator';
import { ChatUnreadSeparator } from '../../../components/atoms/ChatUnreadSeparator';
import { findFirstUnreadIndex, isSameMessageGroup } from '../lib/messageGrouping';
import { NewMessagesBadge } from '../components/molecules/NewMessagesBadge';
import { useAuth } from '../context/useAuth';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { useChatActions } from '../hooks/useChatActions';
import { useChatScroll } from '../hooks/useChatScroll';
import { useScrollRestoreOnPrepend } from '../hooks/useScrollRestoreOnPrepend';
import { useScrollToMessage } from '../hooks/useScrollToMessage';
import { useResetViewportScroll } from '../hooks/useResetViewportScroll';
import { saveRecentDM } from '../../../lib/recentDM';
import styles from '../components/ChatRoom.module.css';
import pageStyles from './DMPage.module.css';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { Avatar } from '../../../components/atoms/Avatar';
import { StatusText } from '../../../components/atoms/StatusText';
import { storageUrl } from '../../../lib/storage';

export const DMPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  useResetViewportScroll([roomId]);
  const { userId: currentUserID } = useAuth();
  const {
    room,
    messages,
    error,
    addMessage,
    initialLastReadAt,
    partnerLastReadAt,
    hasMoreBefore,
    hasMoreAfter,
    loadingOlder,
    loadingNewer,
    loadOlderMessages,
    loadNewerMessages,
    pendingScrollId,
    jumpToMessage,
    clearPendingScroll,
  } = useRoomMessages(roomId);

  const partner = room?.user.find((u) => u.ID !== currentUserID);
  const isBlocked = room?.isMessagingDisabled ?? false;
  const {
    content, setContent,
    selectedFiles, setSelectedFiles,
    sending,
    sendError,
    editingId, setEditingId,
    editContent, setEditContent,
    replyTarget, setReplyTarget,
    handleSend, handleDelete, handleSaveEdit,
  } = useChatActions(roomId, addMessage);

  // 双方向スクロールページング
  const messageListRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  const { bottomRef, firstUnreadRef, newMessageCount, isAtBottom, scrollToLatest, releaseAutoScroll } = useChatScroll({
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

  const loadOlderWithScrollRestore = useCallback(async () => {
    beginRestore();
    await loadOlderMessages();
  }, [beginRestore, loadOlderMessages]);

  // 上センチネル: 古いメッセージを取得
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = messageListRef.current;
    if (!sentinel || !container || !hasMoreBefore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadOlderWithScrollRestore();
        }
      },
      { root: container, rootMargin: '200px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreBefore, loadOlderWithScrollRestore]);

  // 下センチネル: 新しいメッセージを取得（歴史閲覧中のみ active）
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    const container = messageListRef.current;
    if (!sentinel || !container || !hasMoreAfter) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadNewerMessages();
        }
      },
      { root: container, rootMargin: '0px 0px 200px 0px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreAfter, loadNewerMessages]);

  useEffect(() => {
    if (!room || !roomId) return;
    if (partner) {
      saveRecentDM({ roomID: roomId, partnerName: partner.name, partnerAccountID: partner.accountID });
    }
  }, [room, roomId, partner]);

  useEffect(() => {
    if (error && error.includes('not a member of this room')) {
      navigate('/dm', { replace: true });
    }
  }, [error, navigate]);

  const partnerName = partner?.name ?? 'DM';
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
  const firstUnreadIndex = findFirstUnreadIndex(messages, initialLastReadAtMs, (m) => m.user.ID === currentUserID);

  return (
    <div className={styles.container}>
      <UserSidebar />

      <div className={styles.roomHeader}>
        <button type="button" onClick={() => navigate(-1)} aria-label="前のページに戻る">
          <ChevronLeft />
        </button>
        {partner ? (
          <button
            type="button"
            onClick={() => navigate(`/users/${partner.ID}`)}
            aria-label={`${partner.name} のマイページへ移動`}
            className={styles.avatarButton}
          >
            {partner.avatarUrl ? (
            <img
              src={storageUrl(partner.avatarUrl) ?? undefined}
              alt={partner.name}
              className={styles.headerAvatar}
            />
            ) : (
              <Avatar name={partnerName} size={36} />
            )}
          </button>
        ) : (
          <Avatar name={partnerName} size={36} />
        )}
        <strong className={styles.roomTitle}>{partnerName}</strong>
      </div>

      <div className={styles.messageListWrapper}>
        <div className={styles.messageList} ref={messageListRef}>
          <div ref={topSentinelRef} className={styles.scrollSentinel} />
          {loadingOlder && (
            <StatusText style={{ padding: '0.5rem', fontSize: '0.8rem' }}>読み込み中...</StatusText>
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

            const isLastReadByPartner = isMine && msg.ID === lastReadMessageId;

            return (
              <React.Fragment key={msg.ID}>
                <ChatDateSeparator
                  currentCreatedAt={msg.createdAt}
                  prevCreatedAt={prevMsg?.createdAt}
                />

                {isFirstUnread && <ChatUnreadSeparator ref={firstUnreadRef} />}

                <ChatMessageBubble
                  msg={msg}
                  isMine={isMine}
                  canDelete={isMine}
                  isEditing={editingId === msg.ID}
                  editContent={editContent}
                  onStartEdit={() => {
                    setEditingId(msg.ID);
                    setEditContent(msg.content);
                  }}
                  onSaveEdit={() => handleSaveEdit(msg.ID)}
                  onCancelEdit={() => setEditingId(null)}
                  onEditContentChange={setEditContent}
                  onDelete={() => handleDelete(msg.ID)}
                  isReadByPartner={isLastReadByPartner}
                  onReply={isBlocked ? undefined : () => setReplyTarget(msg)}
                  onJumpToMessage={jumpToMessage}
                  isGroupStart={isGroupStart}
                  isGroupEnd={isGroupEnd}
                />
              </React.Fragment>
            );
          })}
          <div ref={bottomSentinelRef} className={styles.scrollSentinel} />
          {loadingNewer && (
            <StatusText style={{ padding: '0.5rem', fontSize: '0.8rem' }}>読み込み中...</StatusText>
          )}
          <div ref={bottomRef} />
        </div>

        <NewMessagesBadge count={newMessageCount} isAtBottom={isAtBottom} onClick={scrollToLatest} />
      </div>

      {isBlocked && (
        <div className={pageStyles.blockedBanner}>
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
        replyTarget={replyTarget}
        onCancelReply={() => setReplyTarget(null)}
      />
    </div>
  );
};
