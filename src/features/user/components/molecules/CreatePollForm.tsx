import { useState } from 'react';
import styles from '../PollBox.module.css';

type Props = {
  onCreate: (question: string, options: string[], allowMultipleChoice: boolean, deadline?: string) => Promise<void>;
};

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

// date input(YYYY-MM-DD) と time input(HH:mm) を1つの ISO 日時文字列にまとめる。
// 日付だけ指定された場合は「その日の終わりまで」を意図しているとみなし 23:59 を補う。
const buildDeadline = (date: string, time: string): string | undefined => {
  if (!date) return undefined;
  const d = new Date(`${date}T${time || '23:59'}`);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
};

export const CreatePollForm = ({ onCreate }: Props) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultipleChoice, setAllowMultipleChoice] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
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
    setDeadlineDate('');
    setDeadlineTime('');
    setError('');
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o !== '');
    if (!question.trim() || trimmedOptions.length < MIN_OPTIONS || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onCreate(question.trim(), trimmedOptions, allowMultipleChoice, buildDeadline(deadlineDate, deadlineTime));
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
        投票を作成
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formCard}>
      <p className={styles.formTitle}>質問内容</p>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="例：今日の授業で分からなかったところを教えてください"
        className={styles.formInput}
      />

      <p className={styles.formLabel}>回答期限</p>
      <div className={styles.deadlineInputRow}>
        <input
          type="date"
          value={deadlineDate}
          onChange={(e) => setDeadlineDate(e.target.value)}
          className={styles.formInput}
          style={{ marginBottom: 0 }}
        />
        <input
          type="time"
          value={deadlineTime}
          onChange={(e) => setDeadlineTime(e.target.value)}
          className={styles.formInput}
          style={{ marginBottom: 0 }}
        />
      </div>

      <p className={styles.formLabel}>選択肢</p>
      {options.map((option, i) => (
        <div key={i} className={styles.optionInputRow}>
          <input
            type="text"
            value={option}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`${i + 1}.選択肢を入力`}
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
        <button type="button" className={styles.cancelFormButton} onClick={() => { reset(); setOpen(false); }}>
          キャンセル
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={submitting || !question.trim() || options.filter((o) => o.trim() !== '').length < MIN_OPTIONS}
          style={{ marginLeft: '0.5rem' }}
        >
          {submitting ? '投稿中...' : '投票を投稿'}
        </button>
      </div>
    </form>
  );
};
