import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  adminDeleteAnswerAddendum,
  adminDeleteQuestionAddendum,
  adminListQuestionAnswers,
  type AdminAnswerWithAddenda,
} from '../../api/courses';
import { storageUrl } from '../../../../lib/storage';
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

const formatDateTime = (value: string) => new Date(value).toLocaleString('ja-JP');

// 回答1件。本文・投稿者・日時・添付・いいね数・ベストアンサーかどうかと、その追記。
const AnswerItem = ({
  answer,
  isBest,
  onDeleteAddendum,
}: {
  answer: AdminAnswerWithAddenda;
  isBest: boolean;
  onDeleteAddendum: (addendum: Addendum) => void;
}) => (
  <div className={`${courseStyles.addendumAnswer} ${courseStyles.answerItem}`}>
    <div className={courseStyles.answerMeta}>
      {isBest && <span className={courseStyles.bestAnswerBadge}>ベストアンサー</span>}
      <Link to={`/admin/users/${answer.user.ID}`}>{answer.user.name}</Link> @{answer.user.accountID}
      {' · '}{formatDateTime(answer.createdAt)}
      {answer.updatedAt !== answer.createdAt && `（編集: ${formatDateTime(answer.updatedAt)}）`}
      {' · '}いいね {answer.likeCount}
    </div>
    {answer.body && <div className={courseStyles.addendumBody}>{answer.body}</div>}
    {answer.media.length > 0 && (
      <div className={courseStyles.answerMedia}>
        {answer.media.map((m) => (
          <a key={m.ID} href={storageUrl(m.url)} target="_blank" rel="noopener noreferrer">
            {m.contentType.startsWith('image/') ? (
              <img src={storageUrl(m.url)} alt="添付画像" className={courseStyles.answerImage} />
            ) : (
              `添付ファイル（${m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}）`
            )}
          </a>
        ))}
      </div>
    )}
    {answer.addenda.map((addendum) => (
      <AddendumRow key={addendum.ID} addendum={addendum} onDelete={() => onDeleteAddendum(addendum)} />
    ))}
  </div>
);

type Props = {
  questionID: string;
  addenda: Addendum[];
  answerCount: number;
  onQuestionAddendaChange: (addenda: Addendum[]) => void;
  onError: (message: string) => void;
};

// 授業内チャット管理の質問の行に出す、質問への追記と、回答（とその追記）。
// 回答は押したときだけ読む（質問の一覧で回答まで読むと行数が膨らむため）。
export const AdminQuestionAnswers = ({ questionID, addenda, answerCount, onQuestionAddendaChange, onError }: Props) => {
  const [answers, setAnswers] = useState<AdminAnswerWithAddenda[] | null>(null);
  const [total, setTotal] = useState(0);
  const [bestAnswerID, setBestAnswerID] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadAnswers = async (offset: number) => {
    setLoading(true);
    try {
      const page = await adminListQuestionAnswers(questionID, ANSWER_PAGE_SIZE, offset);
      setAnswers((prev) => (offset === 0 ? page.items : [...(prev ?? []), ...page.items]));
      setTotal(page.total);
      setBestAnswerID(page.bestAnswerID);
      setOpen(true);
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

  return (
    <>
      {addenda.map((addendum) => (
        <AddendumRow key={addendum.ID} addendum={addendum} onDelete={() => void deleteFromQuestion(addendum)} />
      ))}
      {answerCount === 0 ? (
        <div className={`${styles.subText} ${courseStyles.addendumAction}`}>回答はまだありません</div>
      ) : (
        <button
          type="button"
          className={`${styles.paginationButton} ${courseStyles.addendumAction}`}
          disabled={loading}
          // 一度読んだ回答は閉じても持っておき、開き直すときは読み直さない
          onClick={() => (answers === null ? void loadAnswers(0) : setOpen((v) => !v))}
        >
          {loading && answers === null ? '読み込み中...' : open ? '回答を閉じる' : `回答を表示（${answerCount}件）`}
        </button>
      )}
      {open && answers !== null && (
        <>
          {answers.map((answer) => (
            <AnswerItem
              key={answer.ID}
              answer={answer}
              isBest={answer.ID === bestAnswerID}
              onDeleteAddendum={(addendum) => void deleteFromAnswer(answer.ID, addendum)}
            />
          ))}
          {answers.length < total && (
            <button type="button" className={`${styles.paginationButton} ${courseStyles.addendumAction}`} disabled={loading} onClick={() => void loadAnswers(answers.length)}>
              {loading ? '読み込み中...' : 'さらに回答を読み込む'}
            </button>
          )}
        </>
      )}
    </>
  );
};
