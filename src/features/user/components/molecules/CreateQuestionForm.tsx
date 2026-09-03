import { useEffect, useRef } from 'react';
import styles from '../QuestionBox.module.css';

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: { preventDefault(): void }) => void;
  disabled?: boolean;
};

export const CreateQuestionForm = ({ value, onChange, onSubmit, disabled }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = !disabled && value.trim() !== '';

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    if (textareaRef.current) resizeTextarea(textareaRef.current);
  }, [value]);

  return (
    <form onSubmit={onSubmit} className={styles.formRow}>
      <textarea
        ref={textareaRef}
        value={value}
        rows={2}
        onChange={(e) => {
          onChange(e.target.value);
          resizeTextarea(e.target);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSubmit) onSubmit({ preventDefault: () => { } });
          }
        }}
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
