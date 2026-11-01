import { useThreadActions } from '../../hooks/useThreadActions';
import useSWR from 'swr';
import type { Message } from '../../api/message';
import { getThread, type ChatThread } from '../../api/thread';
import styles from '../ChatRoom.module.css';

type Props = { thread: NonNullable<Message['thread']>; isMine: boolean };

export function ThreadCard({ thread, isMine }: Props) {
  const navigation = useThreadActions();
  // Share metadata with the open panel, without fetching once per announcement.
  const { data: currentThread } = useSWR<ChatThread | null>(
    ['chat-thread', thread.roomID], () => getThread(thread.roomID),
    { revalidateOnMount: false, revalidateOnFocus: false, revalidateOnReconnect: false },
  );
  return <div className={`${styles.threadBranch} ${isMine ? styles.threadBranchMine : ''}`}>
          <button type="button" className={styles.threadCard} aria-label={`スレッド「${thread.title}」を開く`} onClick={() => navigation.open(thread.roomID)}>
            <span className={styles.threadCardTop}><strong>{thread.title}</strong><span>{currentThread?.messageCount ?? thread.messageCount ?? 0}件のメッセージ <span aria-hidden="true">›</span></span></span>
            <span className={styles.threadCardHint}>{thread.isClosed ? 'クローズ済み · 会話を見る' : 'スレッドで会話する'} <span aria-hidden="true">→</span></span>
          </button>
  </div>;
}
