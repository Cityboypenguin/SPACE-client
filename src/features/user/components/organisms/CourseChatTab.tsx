import { useEffect, useRef } from 'react';
import { ChatMessageBubble } from '../molecules/ChatMessageBubble';
import { ChatInput } from '../molecules/ChatInput';
import { ChatDateSeparator } from '../../../../components/atoms/ChatDateSeparator';
import { NewMessagesBadge } from '../molecules/NewMessagesBadge';
import { useAuth } from '../../context/useAuth';
import { useRoomMessages } from '../../hooks/useRoomMessages';
import { useChatActions } from '../../hooks/useChatActions';
import { useChatScroll } from '../../hooks/useChatScroll';
import { useScrollRestoreOnPrepend } from '../../hooks/useScrollRestoreOnPrepend';
import { isAnonymousUser } from '../../lib/anonymous';
import styles from '../ChatRoom.module.css';

type Props = {
  roomId: string;
  roomWritable: boolean;
};

export const CourseChatTab = ({ roomId, roomWritable }: Props) => {
  const { userId: currentUserID } = useAuth();
  const { messages, error, addMessage, hasMoreBefore, hasMoreAfter, loadingOlder, loadingNewer, loadOlderMessages, loadNewerMessages } = useRoomMessages(roomId);
  const {
    content, setContent,
    selectedFiles, setSelectedFiles,
    sending,
    sendError,
    editingId, setEditingId,
    editContent, setEditContent,
    handleSend, handleDelete, handleSaveEdit,
  } = useChatActions(roomId, addMessage);

  const { bottomRef, newMessageCount, isAtBottom, scrollToLatest } = useChatScroll(messages, currentUserID, roomId, hasMoreAfter);

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
            return (
              <div key={msg.ID} className={styles.messageGroup}>
                <ChatDateSeparator
                  currentCreatedAt={msg.createdAt}
                  prevCreatedAt={prevMsg?.createdAt}
                />
                <ChatMessageBubble
                  msg={msg}
                  isMine={msg.isMine}
                  canDelete={msg.isMine}
                  isEditing={editingId === msg.ID}
                  editContent={editContent}
                  isAnonymousAuthor={isAnonymousUser(msg.user)}
                  onStartEdit={() => { setEditingId(msg.ID); setEditContent(msg.content); }}
                  onSaveEdit={() => handleSaveEdit(msg.ID)}
                  onCancelEdit={() => setEditingId(null)}
                  onEditContentChange={setEditContent}
                  onDelete={() => handleDelete(msg.ID)}
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
        />
      )}
    </>
  );
};
