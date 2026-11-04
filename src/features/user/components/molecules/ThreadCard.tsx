import { useThreadActions } from '../../hooks/useThreadActions';
import type { Message } from '../../api/message';
import styles from '../ChatRoom.module.css';

type Props = { thread: NonNullable<Message['thread']>; isMine: boolean };

export function ThreadCard({ thread, isMine }: Props) {
  const navigation = useThreadActions();
  return <div className={`${styles.threadBranch} ${isMine ? styles.threadBranchMine : ''}`}>
          <button type="button" className={styles.threadCard} aria-label={`スレッド「${thread.title}」を開く`} onClick={() => navigation.openFromChat(thread.roomID)}>
            <span className={styles.threadCardTop}><strong>{thread.title}</strong><span>{thread.messageCount ?? 0}件のメッセージ <span aria-hidden="true">›</span></span></span>
            <span className={styles.threadCardHint}>{thread.isClosed ? 'クローズ済み · 会話を見る' : 'スレッドで会話する'} <span aria-hidden="true">→</span></span>
          </button>
  </div>;
}
