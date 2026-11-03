import { maskNGWordDraft, showNGWordFeedback } from '../../../../lib/ngWordFeedback';
import { useState } from 'react';
import { toUserMessage } from '../../../../lib/errorMessages';
import { type Addendum } from '../../api/question';
import styles from '../QuestionBox.module.css';

const MAX_CHARS = 1000;

type Props = {
  addenda: Addendum[];
  // 追記できるのは質問者（質問）・回答者（回答）本人だけ。書き込めない授業では出さない。
  canAdd: boolean;
  onAdd: (body: string) => Promise<void>;
};

const formatTime = (value: string) =>
  new Date(value).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// 質問・回答の本文の下に並ぶ「追記」の枠。元の本文は変えず、足された順に並べる。
// 追記は編集も削除もできない（しれっと変えられないようにするため）。
export const AddendumSection = ({ addenda, canAdd, onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const trimmed = body.trim();
  const canSubmit = !busy && trimmed !== '' && [...trimmed].length <= MAX_CHARS;

  const close = () => {
    setOpen(false);
    setBody('');
    setError('');
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await onAdd(trimmed);
      close();
    } catch (err) {
      if (showNGWordFeedback(err)) {
        setBody((current) => maskNGWordDraft(err, current));
      } else {
        setError(toUserMessage(err, '追記に失敗しました。時間をおいてから再度お試しください。'));
      }
    } finally {
      setBusy(false);
    }
  };

  if (addenda.length === 0 && !canAdd) return null;

  return (
    <div className={styles.addendumSection}>
      {addenda.map((a) => (
        <div key={a.ID} className={styles.addendumItem}>
          <span className={styles.addendumLabel}>追記</span>
          <p className={styles.addendumBody}>{a.body}</p>
          <span className={styles.addendumTime}>{formatTime(a.createdAt)}</span>
        </div>
      ))}

      {canAdd && !open && (
        <button type="button" className={styles.addendumOpenButton} onClick={() => setOpen(true)}>
          ＋ 追記する
        </button>
      )}

      {canAdd && open && (
        <form onSubmit={handleSubmit} className={styles.addendumForm}>
          <textarea
            value={body}
            rows={3}
            autoFocus
            maxLength={MAX_CHARS}
            placeholder="追記を入力（元の本文は変わりません。追記はあとから編集・削除できません）"
            onChange={(e) => setBody(e.target.value)}
            disabled={busy}
            className={styles.textarea}
          />
          <div className={styles.editActions}>
            <button type="submit" className={styles.submitButton} disabled={!canSubmit}>
              追記する
            </button>
            <button type="button" className={styles.secondaryButton} disabled={busy} onClick={close}>
              キャンセル
            </button>
          </div>
          {error && <p className={styles.inlineError}>{error}</p>}
        </form>
      )}
    </div>
  );
};
