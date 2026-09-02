import { useState } from 'react';
import { type Answer } from '../../api/question';
import styles from '../QuestionBox.module.css';

type Props = {
  answer: Answer;
  isBest: boolean;
  canSelectBest: boolean;
  canCancelBest: boolean;
  onSelectBest: () => Promise<void>;
  onCancelBest: () => Promise<void>;
  onUpdate: (body: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onLike: () => Promise<void>;
  onUnlike: () => Promise<void>;
};

export const AnswerItem = ({
  answer, isBest, canSelectBest, canCancelBest,
  onSelectBest, onCancelBest, onUpdate, onDelete, onLike, onUnlike,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(answer.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ベストアンサーに選ばれている間は編集・削除できない。
  const canEditOrDelete = answer.isMine && !isBest;

  const handleSelectBest = async () => {
    setBusy(true);
    setError('');
    try {
      await onSelectBest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ベストアンサーの選択に失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelBest = async () => {
    setBusy(true);
    setError('');
    try {
      await onCancelBest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ベストアンサーの取り消しに失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!editBody.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await onUpdate(editBody.trim());
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '回答の編集に失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('この回答を削除しますか?')) return;
    setBusy(true);
    setError('');
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : '回答の削除に失敗しました。');
      setBusy(false);
    }
  };

  const handleToggleLike = async () => {
    setBusy(true);
    setError('');
    try {
      if (answer.likedByMe) {
        await onUnlike();
      } else {
        await onLike();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'いいねに失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.answerItem} ${isBest ? styles.answerItemBest : ''}`}>
      <div className={styles.answerHeader}>
        <span className={styles.senderName}>{answer.user.name}</span>
        {isBest && <span className={styles.bestAnswerLabel}>ベストアンサー</span>}
        {isBest && canCancelBest && (
          <button type="button" className={styles.cancelBestButton} disabled={busy} onClick={handleCancelBest}>
            取り消す
          </button>
        )}
        {canSelectBest && !isBest && (
          <button type="button" className={styles.selectBestButton} disabled={busy} onClick={handleSelectBest}>
            ベストアンサーに選ぶ
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSaveEdit} className={styles.formRow}>
          <textarea
            value={editBody}
            rows={1}
            onChange={(e) => setEditBody(e.target.value)}
            disabled={busy}
            className={styles.textarea}
          />
          <button type="submit" disabled={busy || !editBody.trim()} className={styles.submitButton}>
            保存
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => { setEditing(false); setEditBody(answer.body); setError(''); }}
            className={styles.toggleButton}
          >
            キャンセル
          </button>
        </form>
      ) : (
        <p className={styles.body} style={{ margin: 0 }}>{answer.body}</p>
      )}

      <div className={styles.answerFooter}>
        <button
          type="button"
          className={`${styles.likeButton} ${answer.likedByMe ? styles.likeButtonActive : ''}`}
          disabled={busy}
          onClick={handleToggleLike}
        >
          {answer.likedByMe ? '♥' : '♡'} {answer.likeCount}
        </button>
        {canEditOrDelete && !editing && (
          <>
            <button type="button" className={styles.editButton} disabled={busy} onClick={() => setEditing(true)}>
              編集
            </button>
            <button type="button" className={styles.deleteAnswerButton} disabled={busy} onClick={handleDelete}>
              削除
            </button>
          </>
        )}
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0.3rem 0 0' }}>{error}</p>}
    </div>
  );
};
