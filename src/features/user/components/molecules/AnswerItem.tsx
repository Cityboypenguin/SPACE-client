import { useState } from 'react';
import editIcon from '../../../../assets/パーツ_メッセージ編集.svg';
import deleteIcon from '../../../../assets/パーツ_削除.svg';
import likeIconOff from '../../../../assets/パーツ_いいね.svg';
import likeIconOn from '../../../../assets/パーツ_いいね（済）.svg';
import { AppSwal } from '../../../../lib/swal';
import { useTheme } from '../../../../context/useTheme';
import { ClampedText } from '../../../../components/atoms/ClampedText';
import { type Answer } from '../../api/question';
import { PostMediaGrid } from '../../../../components/molecules/PostMediaGrid';
import { DropdownMenu, DropdownMenuItem } from '../../../../components/molecules/DropdownMenu';
import styles from '../QuestionBox.module.css';

type Props = {
  answer: Answer;
  // 書き込み不可のルーム(履修をやめた授業・終了した学期)では編集・いいねをさせない(削除は可)。
  roomWritable: boolean;
  isBest: boolean;
  canSelectBest: boolean;
  canCancelBest: boolean;
  onSelectBest: () => Promise<void>;
  onCancelBest: () => Promise<void>;
  onUpdate: (body: string, deletedMediaIDs: string[]) => Promise<void>;
  onDelete: () => Promise<void>;
  onLike: () => Promise<void>;
  onUnlike: () => Promise<void>;
  // React.forwardRef の generic 呼び出しが Vite の Babel(TSX)パーサーで構文エラーに
  // なるため、素直な callback prop で要素参照を受け渡す。
  rootRef?: (el: HTMLDivElement | null) => void;
};

export const AnswerItem = ({
  answer, roomWritable, isBest, canSelectBest, canCancelBest,
  onSelectBest, onCancelBest, onUpdate, onDelete, onLike, onUnlike, rootRef,
}: Props) => {
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(answer.body);
  // 編集中に外した写真。「保存」を押すまでは実際には削除しない。
  const [editDeletedMediaIDs, setEditDeletedMediaIDs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ベストアンサーに選ばれている間は編集・削除できない。
  const canEditOrDelete = answer.isMine && !isBest;
  const canEdit = canEditOrDelete && roomWritable;
  const hasMenuActions = canEditOrDelete;

  const editRemainingMedia = answer.media.filter((m) => !editDeletedMediaIDs.includes(m.ID));
  // 投稿時と同じく、本文か写真のどちらかが残っていれば保存できる。
  const canSaveEdit = !busy && (editBody.trim() !== '' || editRemainingMedia.length > 0);

  const startEditing = () => {
    setEditBody(answer.body);
    setEditDeletedMediaIDs([]);
    setEditing(true);
  };

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
    if (!canSaveEdit) return;
    setBusy(true);
    setError('');
    try {
      await onUpdate(editBody.trim(), editDeletedMediaIDs);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '回答の編集に失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const result = await AppSwal.fire({
      text: 'この回答を削除しますか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
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
    <div ref={rootRef} className={`${styles.answerItem} ${isBest ? styles.answerItemBest : ''}`}>
      {hasMenuActions && !editing && (
        <DropdownMenu wrapStyle={{ position: 'absolute', top: '0.75rem', right: '1rem' }} disabled={busy}>
          {(close) => (
            canEditOrDelete && (
              <>
                {canEdit && (
                  <DropdownMenuItem icon={editIcon} themedIcon onClick={() => { close(); startEditing(); }}>
                    編集
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem icon={deleteIcon} themedIcon danger onClick={() => { close(); void handleDelete(); }}>
                  削除
                </DropdownMenuItem>
              </>
            )
          )}
        </DropdownMenu>
      )}

      {editing ? (
        <form onSubmit={handleSaveEdit} className={styles.formRow}>
          <textarea
            value={editBody}
            rows={1}
            onChange={(e) => setEditBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (canSaveEdit) handleSaveEdit({ preventDefault: () => { } });
              }
            }}
            disabled={busy}
            maxLength={1000}
            className={styles.textarea}
          />
          <button type="submit" disabled={!canSaveEdit} className={styles.submitButton}>
            保存
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => { setEditing(false); setEditBody(answer.body); setEditDeletedMediaIDs([]); setError(''); }}
            className={styles.toggleButton}
          >
            キャンセル
          </button>
        </form>
      ) : (
        <ClampedText text={answer.body} maxLines={6} className={styles.answerBody} />
      )}

      {editing && editRemainingMedia.length > 0 && (
        <div className={styles.mediaPreviewRow}>
          {editRemainingMedia.map((m) => (
            <div key={m.ID} className={styles.mediaThumb}>
              <img src={m.url} alt="" className={styles.mediaThumbImg} />
              <button
                type="button"
                className={styles.mediaThumbRemove}
                onClick={() => setEditDeletedMediaIDs((prev) => [...prev, m.ID])}
                disabled={busy}
                aria-label="この写真を外す"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {!editing && answer.media.length > 0 && (
        <div className={styles.mediaPreviewGrid}>
          <PostMediaGrid media={answer.media} />
        </div>
      )}

      <div className={styles.answerFooter}>
        <span className={styles.timestamp}>
          {new Date(answer.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
        {isBest && <span className={styles.bestAnswerLabel}>ベストアンサー</span>}
        <div className={styles.answerFooterActions}>
          {canSelectBest && !isBest && (
            <button
              type="button"
              className={styles.selectBestHoverButton}
              disabled={busy}
              onClick={() => void handleSelectBest()}
            >
              ベストアンサーにする
            </button>
          )}
          {canCancelBest && isBest && (
            <button
              type="button"
              className={styles.cancelBestHoverButton}
              disabled={busy}
              onClick={() => void handleCancelBest()}
            >
              ベストアンサーを取り消す
            </button>
          )}
          <button
            type="button"
            className={styles.likeButton}
            disabled={busy || !roomWritable}
            onClick={handleToggleLike}
          >
            <img
              src={answer.likedByMe ? likeIconOn : likeIconOff}
              alt="いいね"
              className={`${styles.likeIcon} ${answer.likedByMe ? '' : theme === 'dark' ? styles.likeIconInactiveDark : styles.likeIconInactive}`}
            />
            <span className={answer.likedByMe ? styles.likeCountActive : styles.likeCountDefault}>
              {answer.likeCount}
            </span>
          </button>
        </div>
      </div>

      {error && <p className={styles.inlineError}>{error}</p>}
    </div>
  );
};
