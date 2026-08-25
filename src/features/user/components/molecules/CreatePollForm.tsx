import { useState } from 'react';
import styles from '../PollBox.module.css';

type Props = {
  onCreate: (question: string, options: string[], allowMultipleChoice: boolean) => Promise<void>;
};

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

export const CreatePollForm = ({ onCreate }: Props) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultipleChoice, setAllowMultipleChoice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultipleChoice(false);
    setError('');
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o !== '');
    if (!question.trim() || trimmedOptions.length < MIN_OPTIONS || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onCreate(question.trim(), trimmedOptions, allowMultipleChoice);
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '投票の作成に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className={styles.toggleFormButton} onClick={() => setOpen(true)}>
        + 投票を作成
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formCard}>
      <p className={styles.formTitle}>新しい投票</p>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="質問文"
        className={styles.formInput}
      />
      {options.map((option, i) => (
        <div key={i} className={styles.optionInputRow}>
          <input
            type="text"
            value={option}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`選択肢 ${i + 1}`}
            className={styles.formInput}
            style={{ marginBottom: 0 }}
          />
          {options.length > MIN_OPTIONS && (
            <button type="button" className={styles.removeOptionButton} onClick={() => removeOption(i)}>✕</button>
          )}
        </div>
      ))}
      {options.length < MAX_OPTIONS && (
        <button type="button" className={styles.addOptionButton} onClick={addOption}>+ 選択肢を追加</button>
      )}

      <label className={styles.checkboxRow}>
        <input type="checkbox" checked={allowMultipleChoice} onChange={(e) => setAllowMultipleChoice(e.target.checked)} />
        複数選択を許可する
      </label>

      {error && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0 0 0.4rem' }}>{error}</p>}

      <div className={styles.submitRow}>
        <button type="button" className={styles.addOptionButton} onClick={() => { reset(); setOpen(false); }}>
          キャンセル
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={submitting || !question.trim() || options.filter((o) => o.trim() !== '').length < MIN_OPTIONS}
          style={{ marginLeft: '0.5rem' }}
        >
          作成する
        </button>
      </div>
    </form>
  );
};
