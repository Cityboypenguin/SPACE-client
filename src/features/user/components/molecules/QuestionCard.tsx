import { useEffect, useState } from 'react';
import { type Question } from '../../api/question';
import styles from '../QuestionBox.module.css';

type Props = {
  question: Question;
  roomWritable: boolean;
  subscribeAnswers: (questionID: string) => () => void;
  onAnswerSubmit: (questionID: string, body: string) => Promise<void>;
  onSelectBestAnswer: (questionID: string, answerID: string) => Promise<void>;
};

export const QuestionCard = ({ question, roomWritable, subscribeAnswers, onAnswerSubmit, onSelectBestAnswer }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [answerBody, setAnswerBody] = useState('');
  const [answering, setAnswering] = useState(false);
  const [selectingID, setSelectingID] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!expanded) return;
    const unsubscribe = subscribeAnswers(question.ID);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, question.ID]);

  const handleAnswerSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!answerBody.trim() || answering) return;
    setAnswering(true);
    setError('');
    try {
      await onAnswerSubmit(question.ID, answerBody.trim());
      setAnswerBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '回答の送信に失敗しました。');
    } finally {
      setAnswering(false);
    }
  };

  const handleSelectBestAnswer = async (answerID: string) => {
    setSelectingID(answerID);
    setError('');
    try {
      await onSelectBestAnswer(question.ID, answerID);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ベストアンサーの選択に失敗しました。');
    } finally {
      setSelectingID(null);
    }
  };

  const canSelectBestAnswer = question.isMine && !question.isAnswered;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.senderName}>{question.user.name}</span>
        <span className={styles.timestamp}>
          {new Date(question.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className={`${styles.badge} ${question.isAnswered ? styles.badgeAnswered : ''}`}>
          {question.isAnswered ? '解決済み' : '未解決'}
        </span>
      </div>

      <p className={styles.body}>{question.body}</p>

      <button type="button" className={styles.toggleButton} onClick={() => setExpanded((v) => !v)}>
        {expanded ? '回答を閉じる' : `回答を見る (${question.answers.length})`}
      </button>

      {expanded && (
        <div className={styles.answersList}>
          {question.answers.map((answer) => {
            const isBest = question.bestAnswer?.ID === answer.ID;
            return (
              <div key={answer.ID} className={`${styles.answerItem} ${isBest ? styles.answerItemBest : ''}`}>
                <div className={styles.answerHeader}>
                  <span className={styles.senderName}>{answer.user.name}</span>
                  {isBest && <span className={styles.bestAnswerLabel}>ベストアンサー</span>}
                  {canSelectBestAnswer && !isBest && (
                    <button
                      type="button"
                      className={styles.selectBestButton}
                      disabled={selectingID === answer.ID}
                      onClick={() => handleSelectBestAnswer(answer.ID)}
                    >
                      ベストアンサーに選ぶ
                    </button>
                  )}
                </div>
                <p className={styles.body} style={{ margin: 0 }}>{answer.body}</p>
              </div>
            );
          })}

          {roomWritable && (
            <form onSubmit={handleAnswerSubmit} className={styles.formRow}>
              <textarea
                value={answerBody}
                rows={1}
                onChange={(e) => setAnswerBody(e.target.value)}
                placeholder="回答を入力..."
                disabled={answering}
                className={styles.textarea}
              />
              <button type="submit" disabled={answering || !answerBody.trim()} className={styles.submitButton}>
                回答する
              </button>
            </form>
          )}

          {error && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0.3rem 0 0' }}>{error}</p>}
        </div>
      )}
    </div>
  );
};
