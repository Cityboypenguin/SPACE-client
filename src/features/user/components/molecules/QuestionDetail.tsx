import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from '../../../../components/atoms/ChevronLeft';
import { ClampedText } from '../../../../components/atoms/ClampedText';
import editIcon from '../../../../assets/パーツ_メッセージ編集.svg';
import deleteIcon from '../../../../assets/パーツ_削除.svg';
import { AppSwal } from '../../../../lib/swal';
import { type Question, type Answer } from '../../api/question';
import { AnswerItem } from './AnswerItem';
import styles from '../QuestionBox.module.css';
import menuStyles from '../organisms/PostCard.module.css';

type Props = {
  question: Question;
  roomWritable: boolean;
  answers: Answer[];
  totalAnswers: number;
  hasMoreAnswers: boolean;
  loadingMoreAnswers: boolean;
  loadMoreAnswers: () => void;
  onBack: () => void;
  onAnswerSubmit: (questionID: string, body: string) => Promise<Answer>;
  onSelectBestAnswer: (questionID: string, answerID: string) => Promise<void>;
  onCancelBestAnswer: (questionID: string) => Promise<void>;
  onUpdateQuestion: (questionID: string, body: string) => Promise<void>;
  onDeleteQuestion: (questionID: string) => Promise<void>;
  onUpdateAnswer: (questionID: string, answerID: string, body: string) => Promise<void>;
  onDeleteAnswer: (questionID: string, answerID: string) => Promise<void>;
  onLikeAnswer: (questionID: string, answerID: string) => Promise<void>;
  onUnlikeAnswer: (questionID: string, answerID: string) => Promise<void>;
};

const formatRelativeTime = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
};

export const QuestionDetail = ({
  question, roomWritable, answers, totalAnswers, hasMoreAnswers, loadingMoreAnswers, loadMoreAnswers,
  onBack, onAnswerSubmit, onSelectBestAnswer, onCancelBestAnswer, onUpdateQuestion, onDeleteQuestion,
  onUpdateAnswer, onDeleteAnswer, onLikeAnswer, onUnlikeAnswer,
}: Props) => {
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editQuestionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const answerPanelRef = useRef<HTMLElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const answerElementsRef = useRef(new Map<string, HTMLDivElement>());
  const [answerBody, setAnswerBody] = useState('');
  const [answering, setAnswering] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editQuestionBody, setEditQuestionBody] = useState(question.body);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    if (answerTextareaRef.current) resizeTextarea(answerTextareaRef.current);
  }, [answerBody]);

  useEffect(() => {
    if (editQuestionTextareaRef.current) resizeTextarea(editQuestionTextareaRef.current);
  }, [editQuestionBody, editingQuestion]);

  // 回答一覧の下端が見えたら次のページを読み込む(全件取得ではなく無限スクロール)。
  // .answerPanel は768px未満でoverflow:visibleになり実際のスクロールコンテナでは
  // なくなる(代わりに .detail 等の祖先がスクロールする)ため、root は特定のスクロール
  // コンテナに固定せずビューポート基準(null)にして、どの祖先がスクロールしても
  // 確実に検知できるようにする。
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    if (!sentinel || !hasMoreAnswers) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreAnswers(); },
      { root: null, rootMargin: '200px 0px 0px 0px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreAnswers, loadMoreAnswers]);

  const handleAnswerSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!answerBody.trim() || answering) return;
    setAnswering(true);
    setError('');
    try {
      const created = await onAnswerSubmit(question.ID, answerBody.trim());
      setAnswerBody('');
      // 追加された回答がDOMに反映されてから、自分の回答までスクロールする。
      requestAnimationFrame(() => {
        answerElementsRef.current.get(created.ID)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '回答の送信に失敗しました。');
    } finally {
      setAnswering(false);
    }
  };

  const handleQuestionUpdate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!editQuestionBody.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await onUpdateQuestion(question.ID, editQuestionBody.trim());
      setEditingQuestion(false);
      setMenuOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '質問の編集に失敗しました。');
    } finally {
      setBusy(false);
    }
  };

  const handleQuestionDelete = async () => {
    const result = await AppSwal.fire({
      text: 'この質問を削除しますか？',
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    setBusy(true);
    setError('');
    try {
      await onDeleteQuestion(question.ID);
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : '質問の削除に失敗しました。');
      setBusy(false);
    }
  };

  const canSubmitAnswer = roomWritable && !answering && answerBody.trim() !== '';
  const orderedAnswers = question.bestAnswer
    ? [
      ...answers.filter((answer) => answer.ID === question.bestAnswer?.ID),
      ...answers.filter((answer) => answer.ID !== question.bestAnswer?.ID),
    ]
    : answers;

  return (
    <div className={styles.detail}>
      <section className={styles.questionPanel}>
        <div className={styles.detailNav}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            <ChevronLeft />
            <span>質問一覧へ</span>
          </button>
          {question.isMine && (
            <div className={menuStyles.menuWrap}>
              <button type="button" className={menuStyles.menuButton} onClick={() => setMenuOpen((v) => !v)} aria-label="メニュー">
                ···
              </button>
              {menuOpen && (
                <div className={menuStyles.dropdown}>
                  <button
                    type="button"
                    className={menuStyles.dropdownItem}
                    onClick={() => { setEditQuestionBody(question.body); setEditingQuestion(true); setMenuOpen(false); }}
                  >
                    <img src={editIcon} alt="" className={`${menuStyles.dropdownIcon} themed-icon`} />
                    編集
                  </button>
                  <button
                    type="button"
                    className={`${menuStyles.dropdownItem} ${menuStyles.dropdownItemDanger}`}
                    onClick={handleQuestionDelete}
                    disabled={busy}
                  >
                    <img src={deleteIcon} alt="" className={`${menuStyles.dropdownIconDelete} themed-icon`} />
                    削除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.detailQuestionBlock}>
          {editingQuestion ? (
            <form onSubmit={handleQuestionUpdate} className={styles.editQuestionForm}>
              <textarea
                ref={editQuestionTextareaRef}
                value={editQuestionBody}
                rows={2}
                onChange={(e) => {
                  setEditQuestionBody(e.target.value);
                  resizeTextarea(e.target);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    if (editQuestionBody.trim()) handleQuestionUpdate({ preventDefault: () => { } });
                  }
                }}
                className={styles.textarea}
                disabled={busy}
              />
              <div className={styles.editActions}>
                <button type="submit" className={styles.submitButton} disabled={busy || !editQuestionBody.trim()}>
                  保存
                </button>
                <button type="button" className={styles.secondaryButton} disabled={busy} onClick={() => setEditingQuestion(false)}>
                  キャンセル
                </button>
              </div>
            </form>
          ) : (
            <ClampedText text={question.body} maxLines={8} className={styles.detailTitle} />
          )}
          <span className={styles.detailTime}>{formatRelativeTime(question.createdAt)}</span>
          <div className={styles.detailMeta}>
            <span>回答{totalAnswers}件</span>
            <span>{question.isAnswered ? 'ベストアンサーあり' : '未解決'}</span>
          </div>
        </div>

        {roomWritable && (
          <form onSubmit={handleAnswerSubmit} className={styles.answerForm}>
            <textarea
              ref={answerTextareaRef}
              value={answerBody}
              rows={1}
              onChange={(e) => {
                setAnswerBody(e.target.value);
                resizeTextarea(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (canSubmitAnswer) handleAnswerSubmit({ preventDefault: () => { } });
                }
              }}
              placeholder="回答する"
              disabled={answering}
              className={styles.answerTextarea}
            />
            <button type="submit" disabled={!canSubmitAnswer} className={styles.answerSubmitButton}>
              回答
            </button>
          </form>
        )}

        {error && <p className={styles.errorText}>{error}</p>}
      </section>

      <section className={styles.answerPanel} ref={answerPanelRef}>
        {answers.length === 0 ? (
          <p className={styles.emptyState}>まだ回答がありません。</p>
        ) : orderedAnswers.map((answer) => {
          const isBest = question.bestAnswer?.ID === answer.ID;
          return (
            <AnswerItem
              key={answer.ID}
              rootRef={(el) => {
                if (el) answerElementsRef.current.set(answer.ID, el);
                else answerElementsRef.current.delete(answer.ID);
              }}
              answer={answer}
              isBest={isBest}
              canSelectBest={question.isMine && !question.isAnswered}
              canCancelBest={question.isMine && question.isAnswered}
              onSelectBest={() => onSelectBestAnswer(question.ID, answer.ID)}
              onCancelBest={() => onCancelBestAnswer(question.ID)}
              onUpdate={(body) => onUpdateAnswer(question.ID, answer.ID, body)}
              onDelete={() => onDeleteAnswer(question.ID, answer.ID)}
              onLike={() => onLikeAnswer(question.ID, answer.ID)}
              onUnlike={() => onUnlikeAnswer(question.ID, answer.ID)}
            />
          );
        })}
        <div ref={bottomSentinelRef} style={{ height: 1 }} />
        {loadingMoreAnswers && (
          <p style={{ color: 'var(--color-text-muted)', padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>読み込み中...</p>
        )}
      </section>
    </div>
  );
};
