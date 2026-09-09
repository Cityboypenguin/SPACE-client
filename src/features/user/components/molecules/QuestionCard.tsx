import { type Question } from '../../api/question';
import { PostMediaGrid } from '../../../../components/molecules/PostMediaGrid';
import styles from '../QuestionBox.module.css';

type Props = {
  question: Question;
  onOpen: () => void;
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

export const QuestionCard = ({ question, onOpen }: Props) => {
  const bestAnswer = question.bestAnswer;
  const otherAnswers = Math.max(0, question.answers.total - (bestAnswer ? 1 : 0));

  return (
    <div role="button" tabIndex={0} className={styles.card} onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}>
      <span className={styles.cardTopLine}>
        {!question.isAnswered && <span className={styles.unansweredBadge}>未回答</span>}
        <span className={styles.cardTime}>{formatRelativeTime(question.createdAt)}</span>
      </span>
      <span className={styles.questionTitle}>{question.body}</span>
      {question.media.length > 0 && (
        <div className={styles.mediaPreviewGrid}>
          <PostMediaGrid media={question.media} />
        </div>
      )}
      {bestAnswer && (
        <span className={styles.bestPreviewBlock}>
          <span className={styles.bestPreviewBadge}>ベストアンサー</span>
          <span className={styles.bestPreviewBody}>{bestAnswer.body}</span>
        </span>
      )}
      <span className={styles.cardAnswerCount}>
        {otherAnswers > 0 ? `他 ${otherAnswers} 件の回答` : `${question.answers.total}件の回答`}
      </span>
    </div>
  );
};
