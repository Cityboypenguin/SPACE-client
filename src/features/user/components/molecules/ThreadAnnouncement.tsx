import { useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import type { Message } from '../../api/message';
import { getThread, type ChatThread } from '../../api/thread';
import styles from '../ChatRoom.module.css';

type Props = { msg: Message; thread: NonNullable<Message['thread']> };

export function ThreadAnnouncement({ msg, thread }: Props) {
  const [, setSearchParams] = useSearchParams();
  // Share metadata with the open panel, without fetching once per announcement.
  const { data: currentThread } = useSWR<ChatThread | null>(
    ['chat-thread', thread.roomID], () => getThread(thread.roomID),
    { revalidateOnMount: false, revalidateOnFocus: false, revalidateOnReconnect: false },
  );
  return <div data-message-id={msg.ID} className={styles.threadMessage}>
      <UserAvatar userId={msg.user.ID} name={msg.user.name} avatarUrl={msg.user.avatarUrl} size={32} />
      <div className={styles.threadMessageBody}>
        <div className={styles.threadMessageAuthor}><strong>{msg.user.name}</strong><time dateTime={msg.createdAt}>{new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</time></div>
        <p className={styles.threadMessageTitle}>{thread.title}</p>
        <div className={styles.threadBranch}>
          <button type="button" className={styles.threadCard} aria-label={`スレッド「${thread.title}」を開く`} onClick={() => setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('threadView'); next.set('thread', thread.roomID); return next; })}>
            <span className={styles.threadCardTop}><strong>{thread.title}</strong><span>{currentThread?.messageCount ?? thread.messageCount ?? 0}件のメッセージ <span aria-hidden="true">›</span></span></span>
            <span className={styles.threadCardHint}>{thread.isClosed ? 'クローズ済み · 会話を見る' : 'スレッドで会話する'} <span aria-hidden="true">→</span></span>
          </button>
        </div>
      </div>
    </div>;
}
