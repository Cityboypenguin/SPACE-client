import { useEffect, useRef } from 'react';
import { ImageAttachButton, ImageAttachPreviews } from './ImageAttachControl';
import styles from '../QuestionBox.module.css';

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: { preventDefault(): void }) => void;
  disabled?: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
};

export const CreateQuestionForm = ({ value, onChange, onSubmit, disabled, files, onFilesChange }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = !disabled && (value.trim() !== '' || files.length > 0);

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    if (textareaRef.current) resizeTextarea(textareaRef.current);
  }, [value]);

  return (
    <form onSubmit={onSubmit} className={styles.composerBox}>
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
        maxLength={1000}
        className={styles.composerTextarea}
      />
      <ImageAttachPreviews files={files} onFilesChange={onFilesChange} disabled={disabled} />
      <div className={styles.composerFooter}>
        <ImageAttachButton files={files} onFilesChange={onFilesChange} disabled={disabled} />
        <button type="submit" disabled={!canSubmit} className={styles.composerSubmitButton}>
          質問する
        </button>
      </div>
    </form>
  );
};
