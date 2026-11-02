import { useEffect, useState } from 'react';
import { useCourseQuestions } from '../../hooks/useCourseQuestions';
import { useQuestionAnswers } from '../../hooks/useQuestionAnswers';
import {
  createQuestion, answerQuestion, selectBestAnswer, cancelBestAnswer,
  deleteQuestion, deleteAnswer, likeAnswer, unlikeAnswer,
  addQuestionAddendum, addAnswerAddendum, getQuestion,
} from '../../api/question';
import { uploadMediaFiles } from '../../api/media';
import { CreateQuestionForm } from '../molecules/CreateQuestionForm';
import { QuestionCard } from '../molecules/QuestionCard';
import { QuestionDetail } from '../molecules/QuestionDetail';
import styles from '../QuestionBox.module.css';

type Props = {
  roomId: string;
  roomWritable: boolean;
  selectedQuestionID: string | null;
  onSelectQuestion: (questionID: string | null) => void;
};

export const QuestionList = ({ roomId, roomWritable, selectedQuestionID, onSelectQuestion }: Props) => {
  const {
    questions, loading, error, hasMore, loadingMore, loadMore,
    addQuestion, updateQuestion, ensureQuestion, bumpAnswerCount, removeQuestion,
  } = useCourseQuestions(roomId);

  const answersState = useQuestionAnswers(selectedQuestionID ?? undefined);

  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const selectedQuestion = questions.find((question) => question.ID === selectedQuestionID) ?? null;

  // 通知から開いた質問が、読み込み済みの一覧（先頭の数十件）に無いときは、その1件だけ取って足す。
  const hasSelectedQuestion = selectedQuestion !== null;
  useEffect(() => {
    if (!selectedQuestionID || loading || hasSelectedQuestion) return;
    let active = true;
    getQuestion(selectedQuestionID)
      .then((q) => { if (active && q && q.roomID === roomId) ensureQuestion(q); })
      .catch(() => { /* 削除済みなど。一覧のまま表示する */ });
    return () => { active = false; };
  }, [selectedQuestionID, loading, hasSelectedQuestion, roomId, ensureQuestion]);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if ((!body.trim() && files.length === 0) || sending) return;
    setSending(true);
    setSendError('');
    try {
      const mediaInputs = await uploadMediaFiles(files);
      const created = await createQuestion(roomId, body.trim(), mediaInputs);
      addQuestion(created);
      setBody('');
      setFiles([]);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : '質問の送信に失敗しました。');
    } finally {
      setSending(false);
    }
  };

  const handleAnswerSubmit = async (questionID: string, answerBody: string, answerFiles?: File[]) => {
    const mediaInputs = answerFiles && answerFiles.length > 0 ? await uploadMediaFiles(answerFiles) : undefined;
    const answer = await answerQuestion(questionID, answerBody, mediaInputs);
    answersState.addAnswer(answer);
    bumpAnswerCount(questionID, 1);
    return answer;
  };

  const handleSelectBestAnswer = async (questionID: string, answerID: string) => {
    const updated = await selectBestAnswer(questionID, answerID);
    updateQuestion(updated);
  };

  const handleCancelBestAnswer = async (questionID: string) => {
    const updated = await cancelBestAnswer(questionID);
    updateQuestion(updated);
  };

  const handleAddQuestionAddendum = async (questionID: string, body: string) => {
    const updated = await addQuestionAddendum(questionID, body);
    updateQuestion(updated);
  };

  const handleAddAnswerAddendum = async (_questionID: string, answerID: string, body: string) => {
    const updated = await addAnswerAddendum(answerID, body);
    answersState.updateAnswer(updated);
  };

  const handleDeleteQuestion = async (questionID: string) => {
    await deleteQuestion(questionID);
    removeQuestion(questionID);
  };

  const handleDeleteAnswer = async (questionID: string, answerID: string) => {
    await deleteAnswer(answerID);
    answersState.removeAnswer(answerID);
    bumpAnswerCount(questionID, -1);
  };

  const handleLikeAnswer = async (_questionID: string, answerID: string) => {
    const updated = await likeAnswer(answerID);
    answersState.updateAnswer(updated);
  };

  const handleUnlikeAnswer = async (_questionID: string, answerID: string) => {
    const updated = await unlikeAnswer(answerID);
    answersState.updateAnswer(updated);
  };

  if (selectedQuestion) {
    return (
      <div className={styles.tabContentDetail}>
        <QuestionDetail
          question={selectedQuestion}
          roomWritable={roomWritable}
          answers={answersState.answers}
          totalAnswers={answersState.total}
          hasMoreAnswers={answersState.hasMore}
          loadingMoreAnswers={answersState.loadingMore}
          loadMoreAnswers={answersState.loadMore}
          onBack={() => onSelectQuestion(null)}
          onAnswerSubmit={handleAnswerSubmit}
          onSelectBestAnswer={handleSelectBestAnswer}
          onCancelBestAnswer={handleCancelBestAnswer}
          onDeleteQuestion={handleDeleteQuestion}
          onAddQuestionAddendum={handleAddQuestionAddendum}
          onAddAnswerAddendum={handleAddAnswerAddendum}
          onDeleteAnswer={handleDeleteAnswer}
          onLikeAnswer={handleLikeAnswer}
          onUnlikeAnswer={handleUnlikeAnswer}
        />
      </div>
    );
  }

  return (
    <div className={styles.tabContent}>
      {roomWritable && (
        <div>
          <CreateQuestionForm
            value={body}
            onChange={setBody}
            onSubmit={handleSubmit}
            disabled={sending}
            files={files}
            onFilesChange={setFiles}
          />
          {sendError && <p className={styles.inlineError}>{sendError}</p>}
        </div>
      )}

      {error && <p className={styles.listError}>{error}</p>}

      {!loading && questions.length === 0 && !error && (
        <p className={styles.emptyState}>まだ質問がありません。</p>
      )}

      {questions.map((question) => (
        <QuestionCard
          key={question.ID}
          question={question}
          onOpen={() => onSelectQuestion(question.ID)}
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
