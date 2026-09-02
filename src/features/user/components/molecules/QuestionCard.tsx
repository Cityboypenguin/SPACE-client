import { useEffect, useState } from 'react';
import { type Question } from '../../api/question';
import { AnswerItem } from './AnswerItem';
import styles from '../QuestionBox.module.css';

type Props = {
  question: Question;
  roomWritable: boolean;
  subscribeAnswers: (questionID: string) => () => void;
  onAnswerSubmit: (questionID: string, body: string) => Promise<void>;
  onSelectBestAnswer: (questionID: string, answerID: string) => Promise<void>;
  onCancelBestAnswer: (questionID: string) => Promise<void>;
  onUpdateAnswer: (questionID: string, answerID: string, body: string) => Promise<void>;
  onDeleteAnswer: (questionID: string, answerID: string) => Promise<void>;
  onLikeAnswer: (questionID: string, answerID: string) => Promise<void>;
  onUnlikeAnswer: (questionID: string, answerID: string) => Promise<void>;
};

export const QuestionCard = ({
  question, roomWritable, subscribeAnswers, onAnswerSubmit,
  onSelectBestAnswer, onCancelBestAnswer, onUpdateAnswer, onDeleteAnswer, onLikeAnswer, onUnlikeAnswer,
}: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [answerBody, setAnswerBody] = useState('');
  const [answering, setAnswering] = useState(false);
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

  const canSelectBestAnswer = question.isMine && !question.isAnswered;
  const canCancelBestAnswer = question.isMine && question.isAnswered;

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
              <AnswerItem
                key={answer.ID}
                answer={answer}
                isBest={isBest}
                canSelectBest={canSelectBestAnswer}
                canCancelBest={canCancelBestAnswer}
                onSelectBest={() => onSelectBestAnswer(question.ID, answer.ID)}
                onCancelBest={() => onCancelBestAnswer(question.ID)}
                onUpdate={(body) => onUpdateAnswer(question.ID, answer.ID, body)}
                onDelete={() => onDeleteAnswer(question.ID, answer.ID)}
                onLike={() => onLikeAnswer(question.ID, answer.ID)}
                onUnlike={() => onUnlikeAnswer(question.ID, answer.ID)}
              />
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
