import styles from '../organisms/chatRoom.module.css';

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: { preventDefault(): void }) => void;
  disabled?: boolean;
};

export const ChatInput = ({ value, onChange, onSubmit, disabled }: Props) => (
  <form onSubmit={onSubmit} className={styles.inputForm}>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="メッセージを入力..."
      disabled={disabled}
      className={styles.inputField}
      autoFocus
    />
    <button type="submit" disabled={disabled || !value.trim()}>
      {disabled ? '送信中...' : '送信'}
    </button>
  </form>
);
