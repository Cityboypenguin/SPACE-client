import { useEffect, useRef, useState } from 'react';
import editIcon from '../../../../assets/パーツ_メッセージ編集.svg';
import deleteIcon from '../../../../assets/パーツ_削除.svg';
import likeIconOff from '../../../../assets/パーツ_いいね.svg';
import likeIconOn from '../../../../assets/パーツ_いいね（済）.svg';
import { AppSwal } from '../../../../lib/swal';
import { useTheme } from '../../../../context/useTheme';
import { ClampedText } from '../../../../components/atoms/ClampedText';
import { type Answer } from '../../api/question';
import { PostMediaGrid } from '../../../../components/molecules/PostMediaGrid';
import styles from '../QuestionBox.module.css';
import menuStyles from '../organisms/PostCard.module.css';

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
  // React.forwardRef の generic 呼び出しが Vite の Babel(TSX)パーサーで構文エラーに
  // なるため、素直な callback prop で要素参照を受け渡す。
  rootRef?: (el: HTMLDivElement | null) => void;
};

export const AnswerItem = ({
  answer, isBest, canSelectBest, canCancelBest,
  onSelectBest, onCancelBest, onUpdate, onDelete, onLike, onUnlike, rootRef,
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(answer.body);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ベストアンサーに選ばれている間は編集・削除できない。
  const canEditOrDelete = answer.isMine && !isBest;
  const hasMenuActions = canEditOrDelete;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

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
        <div className={`${menuStyles.menuWrap} ${styles.answerMenu}`} ref={menuRef}>
          <button
            type="button"
            className={menuStyles.menuButton}
            disabled={busy}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="メニュー"
          >
            ···
          </button>
          {menuOpen && (
            <div className={menuStyles.dropdown}>
              {canEditOrDelete && (
                <>
                  <button
                    type="button"
                    className={menuStyles.dropdownItem}
                    onClick={() => { setMenuOpen(false); setEditing(true); }}
                  >
                    <img src={editIcon} alt="" className={`${menuStyles.dropdownIcon} themed-icon`} />
                    編集
                  </button>
                  <button
                    type="button"
                    className={`${menuStyles.dropdownItem} ${menuStyles.dropdownItemDanger}`}
                    onClick={() => { setMenuOpen(false); void handleDelete(); }}
                  >
                    <img src={deleteIcon} alt="" className={`${menuStyles.dropdownIconDelete} themed-icon`} />
                    削除
                  </button>
                </>
              )}
            </div>
          )}
        </div>
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
                if (editBody.trim()) handleSaveEdit({ preventDefault: () => { } });
              }
            }}
            disabled={busy}
            maxLength={1000}
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
        <ClampedText text={answer.body} maxLines={6} className={styles.answerBody} />
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
            disabled={busy}
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
