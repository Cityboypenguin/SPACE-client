import { useState } from 'react';
import {
  adminDeleteAnswerAddendum,
  adminDeleteQuestionAddendum,
  adminListQuestionAnswers,
  type AdminAnswerWithAddenda,
} from '../../api/courses';
import styles from '../../styles/AdminShared.module.css';
import courseStyles from '../../styles/CourseChatAdmin.module.css';

const ANSWER_PAGE_SIZE = 50;

type Addendum = { ID: string; body: string };

const confirmDelete = () => window.confirm('この追記を削除しますか？（質問・回答そのものは残ります。元に戻せません）');

// 追記1件と削除ボタン。
const AddendumRow = ({ addendum, onDelete }: { addendum: Addendum; onDelete: () => void }) => (
  <div className={`${styles.subText} ${courseStyles.addendumRow}`}>
    <span className={courseStyles.addendumBody}>追記: {addendum.body}</span>
    <button type="button" className={styles.dangerButton} onClick={onDelete}>追記を削除</button>
  </div>
);

type Props = {
  questionID: string;
  addenda: Addendum[];
  answerCount: number;
  onQuestionAddendaChange: (addenda: Addendum[]) => void;
  onError: (message: string) => void;
};

// 授業内チャット管理の質問の行に出す、質問への追記と、回答への追記。
// 回答は押したときだけ読む（質問の一覧で回答まで読むと行数が膨らむため）。
export const AdminAddendumList = ({ questionID, addenda, answerCount, onQuestionAddendaChange, onError }: Props) => {
  const [answers, setAnswers] = useState<AdminAnswerWithAddenda[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadAnswers = async (offset: number) => {
    setLoading(true);
    try {
      const page = await adminListQuestionAnswers(questionID, ANSWER_PAGE_SIZE, offset);
      setAnswers((prev) => (offset === 0 ? page.items : [...(prev ?? []), ...page.items]));
      setTotal(page.total);
    } catch {
      onError('回答の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const deleteFromQuestion = async (addendum: Addendum) => {
    if (!confirmDelete()) return;
    try {
      await adminDeleteQuestionAddendum(addendum.ID);
      onQuestionAddendaChange(addenda.filter((a) => a.ID !== addendum.ID));
    } catch {
      onError('追記の削除に失敗しました');
    }
  };

  const deleteFromAnswer = async (answerID: string, addendum: Addendum) => {
    if (!confirmDelete()) return;
    try {
      await adminDeleteAnswerAddendum(addendum.ID);
      setAnswers((prev) => (prev ?? []).map((a) => (
        a.ID === answerID ? { ...a, addenda: a.addenda.filter((x) => x.ID !== addendum.ID) } : a
      )));
    } catch {
      onError('追記の削除に失敗しました');
    }
  };

  const withAddenda = (answers ?? []).filter((a) => a.addenda.length > 0);

  return (
    <>
      {addenda.map((addendum) => (
        <AddendumRow key={addendum.ID} addendum={addendum} onDelete={() => void deleteFromQuestion(addendum)} />
      ))}
      {answerCount > 0 && answers === null && (
        <button type="button" className={`${styles.paginationButton} ${courseStyles.addendumAction}`} disabled={loading} onClick={() => void loadAnswers(0)}>
          {loading ? '読み込み中...' : '回答への追記を表示'}
        </button>
      )}
      {answers !== null && withAddenda.length === 0 && answers.length >= total && (
        <div className={`${styles.subText} ${courseStyles.addendumAction}`}>回答への追記はありません。</div>
      )}
      {withAddenda.map((answer) => (
        <div key={answer.ID} className={courseStyles.addendumAnswer}>
          <div className={`${styles.subText} ${courseStyles.wrapAnywhere}`}>
            回答（{answer.user.name} @{answer.user.accountID}）: {answer.body}
          </div>
          {answer.addenda.map((addendum) => (
            <AddendumRow key={addendum.ID} addendum={addendum} onDelete={() => void deleteFromAnswer(answer.ID, addendum)} />
          ))}
        </div>
      ))}
      {answers !== null && answers.length < total && (
        <button type="button" className={`${styles.paginationButton} ${courseStyles.addendumAction}`} disabled={loading} onClick={() => void loadAnswers(answers.length)}>
          {loading ? '読み込み中...' : 'さらに回答を読み込む'}
        </button>
      )}
    </>
  );
};
