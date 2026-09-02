import { useState } from 'react';
import { useCourseQuestions } from '../../hooks/useCourseQuestions';
import {
  createQuestion, answerQuestion, selectBestAnswer, cancelBestAnswer,
  updateAnswer, deleteAnswer, likeAnswer, unlikeAnswer,
} from '../../api/question';
import { CreateQuestionForm } from '../molecules/CreateQuestionForm';
import { QuestionCard } from '../molecules/QuestionCard';
import styles from '../QuestionBox.module.css';

type Props = {
  roomId: string;
  roomWritable: boolean;
};

export const QuestionList = ({ roomId, roomWritable }: Props) => {
  const {
    questions, loading, error, hasMore, loadingMore, loadMore,
    subscribeAnswers, addQuestion, addAnswer, updateAnswerInList, removeAnswer, updateQuestion,
  } = useCourseQuestions(roomId);

  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    setSendError('');
    try {
      const created = await createQuestion(roomId, body.trim());
      addQuestion(created);
      setBody('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : '質問の送信に失敗しました。');
    } finally {
      setSending(false);
    }
  };

  const handleAnswerSubmit = async (questionID: string, answerBody: string) => {
    const answer = await answerQuestion(questionID, answerBody);
    addAnswer(questionID, answer);
  };

  const handleSelectBestAnswer = async (questionID: string, answerID: string) => {
    const updated = await selectBestAnswer(questionID, answerID);
    updateQuestion(updated);
  };

  const handleCancelBestAnswer = async (questionID: string) => {
    const updated = await cancelBestAnswer(questionID);
    updateQuestion(updated);
  };

  const handleUpdateAnswer = async (questionID: string, answerID: string, body: string) => {
    const updated = await updateAnswer(answerID, body);
    updateAnswerInList(questionID, updated);
  };

  const handleDeleteAnswer = async (questionID: string, answerID: string) => {
    await deleteAnswer(answerID);
    removeAnswer(questionID, answerID);
  };

  const handleLikeAnswer = async (questionID: string, answerID: string) => {
    const updated = await likeAnswer(answerID);
    updateAnswerInList(questionID, updated);
  };

  const handleUnlikeAnswer = async (questionID: string, answerID: string) => {
    const updated = await unlikeAnswer(answerID);
    updateAnswerInList(questionID, updated);
  };

  return (
    <div className={styles.tabContent}>
      {roomWritable && (
        <div>
          <CreateQuestionForm value={body} onChange={setBody} onSubmit={handleSubmit} disabled={sending} />
          {sendError && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '0.3rem 0 0' }}>{sendError}</p>}
        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}

      {!loading && questions.length === 0 && !error && (
        <p className={styles.emptyState}>まだ質問がありません。</p>
      )}

      {questions.map((question) => (
        <QuestionCard
          key={question.ID}
          question={question}
          roomWritable={roomWritable}
          subscribeAnswers={subscribeAnswers}
          onAnswerSubmit={handleAnswerSubmit}
          onSelectBestAnswer={handleSelectBestAnswer}
          onCancelBestAnswer={handleCancelBestAnswer}
          onUpdateAnswer={handleUpdateAnswer}
          onDeleteAnswer={handleDeleteAnswer}
          onLikeAnswer={handleLikeAnswer}
          onUnlikeAnswer={handleUnlikeAnswer}
        />
      ))}

      {hasMore && (
        <button type="button" className={styles.loadMoreButton} onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? '読み込み中...' : 'もっと見る'}
        </button>
      )}
    </div>
  );
};
