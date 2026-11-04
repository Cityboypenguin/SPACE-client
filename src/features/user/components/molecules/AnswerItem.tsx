import { useState } from 'react';
import deleteIcon from '../../../../assets/パーツ_削除.svg';
import likeIconOff from '../../../../assets/パーツ_いいね.svg';
import likeIconOn from '../../../../assets/パーツ_いいね（済）.svg';
import { AppSwal } from '../../../../lib/swal';
import { useTheme } from '../../../../context/useTheme';
import { ClampedText } from '../../../../components/atoms/ClampedText';
import { type Answer } from '../../api/question';
import { PostMediaGrid } from '../../../../components/molecules/PostMediaGrid';
import { ReportModal } from '../organisms/ReportModal';
import reportIcon from '../../../../assets/パーツ_通報.svg';
import { AddendumSection } from './AddendumSection';
import { FILES_REMOVED_TEXT } from '../../constants/filesRemoved';
import { DropdownMenu, DropdownMenuItem } from '../../../../components/molecules/DropdownMenu';
import { AuthorLabel } from './AuthorLabel';
import styles from '../QuestionBox.module.css';

type Props = {
  answer: Answer;
  // 書き込み不可のルーム(履修をやめた授業・終了した学期)では編集・いいねをさせない。
  // 削除はメニューに出したままにしてあるが、サーバー側でも同様に拒否されるため、
  // 押すとエラーメッセージが出る(投票の削除と同じ挙動)。
  roomWritable: boolean;
  isBest: boolean;
  canSelectBest: boolean;
  canCancelBest: boolean;
  onSelectBest: () => Promise<void>;
  onCancelBest: () => Promise<void>;
  onAddAddendum: (body: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onLike: () => Promise<void>;
  onUnlike: () => Promise<void>;
  // React.forwardRef の generic 呼び出しが Vite の Babel(TSX)パーサーで構文エラーに
  // なるため、素直な callback prop で要素参照を受け渡す。
  rootRef?: (el: HTMLDivElement | null) => void;
};

export const AnswerItem = ({
  answer, roomWritable, isBest, canSelectBest, canCancelBest,
  onSelectBest, onCancelBest, onAddAddendum, onDelete, onLike, onUnlike, rootRef,
}: Props) => {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ベストアンサーに選ばれている間は削除できない。
  const canDelete = answer.isMine && !isBest;
  const canReport = !answer.isMine;
  const hasMenuActions = canDelete || canReport;
  const [reporting, setReporting] = useState(false);

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
      {hasMenuActions && (
        <DropdownMenu wrapStyle={{ position: 'absolute', top: '0.75rem', right: '1rem' }} disabled={busy}>
          {(close) => (
            <>
              {canDelete && (
                <DropdownMenuItem icon={deleteIcon} themedIcon danger onClick={() => { close(); void handleDelete(); }}>
                  削除
                </DropdownMenuItem>
              )}
              {canReport && (
                <DropdownMenuItem icon={reportIcon} themedIcon danger onClick={() => { close(); setReporting(true); }}>
                  通報
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenu>
      )}

      <div className={styles.answerAuthor}>
        <AuthorLabel user={answer.user} />
      </div>

      {answer.body.trim() === '' && answer.media.length === 0
          ? <p className={styles.filesRemoved}>{FILES_REMOVED_TEXT}</p>
          : <ClampedText text={answer.body} maxLines={6} className={styles.answerBody} />}

      {answer.media.length > 0 && (
        <div className={styles.mediaPreviewGrid}>
          <PostMediaGrid media={answer.media} />
        </div>
      )}

      <AddendumSection addenda={answer.addenda} canAdd={answer.isMine && roomWritable} onAdd={onAddAddendum} />

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

      {reporting && (
        <ReportModal
          isOpen
          onClose={() => setReporting(false)}
          targetType="ANSWER"
          targetID={answer.ID}
          postContent={answer.body}
        />
      )}
    </div>
  );
};
