import styles from '../organisms/chatRoom.module.css';

type Props = {
  count: number;
  onClick: () => void;
};

export const NewMessagesBadge = ({ count, onClick }: Props) => {
  if (count === 0) return null;
  return (
    <button className={styles.scrollToLatest} onClick={onClick}>
      ↓ {count}件の新しいメッセージ
    </button>
  );
};
