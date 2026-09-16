import { useEffect, useRef } from 'react';
import { ChatMessageBubble } from '../molecules/ChatMessageBubble';
import { ChatInput } from '../molecules/ChatInput';
import { ChatDateSeparator } from '../../../../components/atoms/ChatDateSeparator';
import { ChatUnreadSeparator } from '../../../../components/atoms/ChatUnreadSeparator';
import { NewMessagesBadge } from '../molecules/NewMessagesBadge';
import { useRoomMessages } from '../../hooks/useRoomMessages';
import { useChatActions } from '../../hooks/useChatActions';
import { useChatScroll } from '../../hooks/useChatScroll';
import { useScrollRestoreOnPrepend } from '../../hooks/useScrollRestoreOnPrepend';
import { useScrollToMessage } from '../../hooks/useScrollToMessage';
import { isAnonymousUser } from '../../lib/anonymous';
import styles from '../ChatRoom.module.css';

type Props = {
  roomId: string;
  roomWritable: boolean;
  // 返信通知から開いたときのジャンプ先メッセージID
  aroundMessageId?: string | null;
};

export const CourseChatTab = ({ roomId, roomWritable, aroundMessageId }: Props) => {
  const { messages, error, addMessage, initialLastReadAt, hasMoreBefore, hasMoreAfter, loadingOlder, loadingNewer, loadOlderMessages, loadNewerMessages, pendingScrollId, jumpToMessage, clearPendingScroll } = useRoomMessages(roomId, { aroundMessageId });
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

  // ルームを開いた時点の既読位置。開いている間に既読が進んでも区切り線は動かさない(DM・コミュニティと同じ)。
  const initialLastReadAtMs = initialLastReadAt ? new Date(initialLastReadAt).getTime() : null;

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

  return (
    <>
      <div className={styles.messageListWrapper}>
        <div className={styles.messageList} ref={messageListRef}>
          <div ref={topSentinelRef} className={styles.scrollSentinel} />
          {loadingOlder && (
            <p className={styles.loadingText}>読み込み中...</p>
          )}
          {(error || sendError) && <p className={styles.errorText}>{error || sendError}</p>}

          {messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const msgTimeMs = new Date(msg.createdAt).getTime();
            const prevMsgTimeMs = prevMsg ? new Date(prevMsg.createdAt).getTime() : null;
            // 授業チャットは匿名表示のため、自分の投稿かどうかは user.ID ではなく isMine で判定する。
            const isFirstUnread = !msg.isMine && initialLastReadAtMs !== null
              && msgTimeMs > initialLastReadAtMs
              && (prevMsgTimeMs === null || prevMsgTimeMs <= initialLastReadAtMs);
            return (
              <div key={msg.ID} className={styles.messageGroup}>
                <ChatDateSeparator
                  currentCreatedAt={msg.createdAt}
                  prevCreatedAt={prevMsg?.createdAt}
                />
                {isFirstUnread && <ChatUnreadSeparator ref={firstUnreadRef} />}
                <ChatMessageBubble
                  msg={msg}
                  isMine={msg.isMine}
                  canDelete={msg.isMine}
                  editable={roomWritable}
                  isEditing={editingId === msg.ID}
                  editContent={editContent}
                  isAnonymousAuthor={isAnonymousUser(msg.user)}
                  onStartEdit={() => { setEditingId(msg.ID); setEditContent(msg.content); }}
                  onSaveEdit={() => handleSaveEdit(msg.ID)}
                  onCancelEdit={() => setEditingId(null)}
                  onEditContentChange={setEditContent}
                  onDelete={() => handleDelete(msg.ID)}
                  onReply={roomWritable ? () => setReplyTarget(msg) : undefined}
                  onJumpToMessage={jumpToMessage}
                />
              </div>
            );
          })}
          <div ref={bottomSentinelRef} className={styles.scrollSentinel} />
          {loadingNewer && (
            <p className={styles.loadingText}>読み込み中...</p>
          )}
          <div ref={bottomRef} />
        </div>

        <NewMessagesBadge count={newMessageCount} isAtBottom={isAtBottom} onClick={scrollToLatest} />
      </div>

      {roomWritable && (
        <ChatInput
          value={content}
          onChange={setContent}
          onSubmit={handleSend}
          onFileSelect={setSelectedFiles}
          selectedFiles={selectedFiles}
          disabled={sending}
          replyTarget={replyTarget}
          onCancelReply={() => setReplyTarget(null)}
        />
      )}
    </>
  );
};
