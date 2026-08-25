import styles from '../QuestionBox.module.css';

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: { preventDefault(): void }) => void;
  disabled?: boolean;
};

export const CreateQuestionForm = ({ value, onChange, onSubmit, disabled }: Props) => {
  const canSubmit = !disabled && value.trim() !== '';

  return (
    <form onSubmit={onSubmit} className={styles.formRow}>
      <textarea
        value={value}
        rows={2}
        onChange={(e) => onChange(e.target.value)}
        placeholder="質問を入力..."
        disabled={disabled}
        className={styles.textarea}
      />
      <button type="submit" disabled={!canSubmit} className={styles.submitButton}>
        質問する
      </button>
    </form>
  );
};
