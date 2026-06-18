import styles from '../organisms/chatRoom.module.css';

type Props = {
  count: number;
  isAtBottom: boolean;
  onClick: () => void;
};

export const NewMessagesBadge = ({ count, isAtBottom, onClick }: Props) => {
  if (count === 0 || isAtBottom) return null;
  return (
    <button className={styles.scrollToLatest} onClick={onClick}>
      ↓ {count}件の新しいメッセージ
    </button>
  );
};
