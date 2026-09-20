import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { listRoomMessages, adminDeleteMessage, adminMessagePageSize, type Message } from '../api/communities';
import {
  getCourse,
  getCourseQuestions,
  adminDeleteQuestion,
  getCoursePolls,
  adminDeletePoll,
  adminCoursePageSize,
  type Course,
  type Question,
  type Poll,
} from '../api/courses';
import { AdminPagination } from '../components/molecules/AdminPagination';
import { AdminHeader } from '../components/organisms/AdminHeader';
import styles from '../styles/AdminShared.module.css';

export const AdminCourseChatDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [course, setCourse] = useState<Course | null>(
    (location.state as { course?: Course })?.course ?? null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  // メッセージはカーソル方式で古い側へ辿る（messages クエリが before を取るため）。
  // 総件数は返らないので「まだ古いものがあるか」だけを持つ。
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  // 継ぎ足しの起点。messages そのものを見ると、配列が変わるたびに
  // loadOlderMessages が作り直される（＝ボタンの再生成が毎回走る）。
  // 必要なのは「一番古いID」の1つだけなので、それだけを持つ。
  const [oldestMessageID, setOldestMessageID] = useState<string | null>(null);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  // 二重押しの防止は ref で持つ。state を判定に使うと、それが依存に入って
  // loadOlderMessages が読み込みのたびに作り直される。
  const loadingOlderRef = useRef(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionPage, setQuestionPage] = useState(0);
  const [questionTotal, setQuestionTotal] = useState(0);

  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollPage, setPollPage] = useState(0);
  const [pollTotal, setPollTotal] = useState(0);
  const [error, setError] = useState('');
  const [messagesError, setMessagesError] = useState('');
  const [questionsError, setQuestionsError] = useState('');
  const [pollsError, setPollsError] = useState('');

  const fetchCourse = useCallback(async () => {
    if (!id) return;
    try {
      const found = await getCourse(id);
      if (found) setCourse(found);
      else setError('授業情報が見つかりませんでした');
    } catch {
      setError('授業情報の取得に失敗しました');
    }
  }, [id]);

  const fetchMessages = useCallback(async (roomID: string) => {
    try {
      const data = await listRoomMessages(roomID);
      setMessages(data.messages.items);
      setHasOlderMessages(data.messages.hasMoreBefore);
      setOldestMessageID(data.messages.items[0]?.ID ?? null);
    } catch {
      setMessagesError('メッセージ一覧の取得に失敗しました');
    }
  }, []);

  // 古い側を1ページぶん継ぎ足す。items は常に古い順で返るので、
  // いま持っている中で一番古い ID を before に渡し、返ってきたぶんを前へ足す。
  const roomID = course?.roomID;
  const loadOlderMessages = useCallback(async () => {
    if (!roomID || !oldestMessageID || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlderMessages(true);
    try {
      const data = await listRoomMessages(roomID, adminMessagePageSize, oldestMessageID);
      setMessages(prev => [...data.messages.items, ...prev]);
      setHasOlderMessages(data.messages.hasMoreBefore);
      // 何も返らなければ起点は据え置き（これ以上古いものは無い）。
      setOldestMessageID(data.messages.items[0]?.ID ?? oldestMessageID);
    } catch {
      setMessagesError('メッセージ一覧の取得に失敗しました');
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlderMessages(false);
    }
  }, [roomID, oldestMessageID]);

  const fetchQuestions = useCallback(async (roomID: string, page: number) => {
    try {
      const data = await getCourseQuestions(roomID, adminCoursePageSize, page * adminCoursePageSize);
      setQuestions(data.items);
      setQuestionTotal(data.total);
    } catch {
      setQuestionsError('質問一覧の取得に失敗しました');
    }
  }, []);

  const fetchPolls = useCallback(async (roomID: string, page: number) => {
    try {
      const data = await getCoursePolls(roomID, adminCoursePageSize, page * adminCoursePageSize);
      setPolls(data.items);
      setPollTotal(data.total);
    } catch {
      setPollsError('投票一覧の取得に失敗しました');
    }
  }, []);

  useEffect(() => {
    if (!course) void Promise.resolve().then(fetchCourse);
  }, [course, fetchCourse]);

  useEffect(() => {
    if (course?.roomID) {
      void Promise.resolve().then(() => fetchMessages(course.roomID));
    }
  }, [course?.roomID, fetchMessages]);

  useEffect(() => {
    if (course?.roomID) {
      void Promise.resolve().then(() => fetchQuestions(course.roomID, questionPage));
    }
  }, [course?.roomID, questionPage, fetchQuestions]);

  useEffect(() => {
    if (course?.roomID) {
      void Promise.resolve().then(() => fetchPolls(course.roomID, pollPage));
    }
  }, [course?.roomID, pollPage, fetchPolls]);

  const handleDeleteMessage = async (message: Message) => {
    if (!window.confirm('このメッセージを削除しますか？')) return;
    try {
      await adminDeleteMessage(message.roomID, message.ID);
      setMessages((prev) => prev.filter((m) => m.ID !== message.ID));
    } catch {
      setError('メッセージの削除に失敗しました');
    }
  };

  const handleDeleteQuestion = async (question: Question) => {
    if (!window.confirm('この質問を削除しますか？（回答もすべて削除されます）')) return;
    try {
      await adminDeleteQuestion(question.ID);
      setQuestions((prev) => prev.filter((q) => q.ID !== question.ID));
      setQuestionTotal((prev) => Math.max(0, prev - 1));
    } catch {
      setError('質問の削除に失敗しました');
    }
  };

  const handleDeletePoll = async (poll: Poll) => {
    if (!window.confirm('この投票を削除しますか？')) return;
    try {
      await adminDeletePoll(poll.ID);
      setPolls((prev) => prev.filter((p) => p.ID !== poll.ID));
      setPollTotal((prev) => Math.max(0, prev - 1));
    } catch {
      setError('投票の削除に失敗しました');
    }
  };

  if (!course) return <p className={styles.page}>{error || '読み込み中...'}</p>;

  return (
    <div>
      <AdminHeader />
      <main className={styles.page}>
        <button onClick={() => navigate('/admin/courses')}><ChevronLeft /> 一覧に戻る</button>
        <h1>授業チャット詳細</h1>

        {error && <p className={styles.errorText}>{error}</p>}

        <table className={styles.infoTable}>
          <tbody>
            <tr><th className={styles.infoHeader}>授業名</th><td>{course.courseName}</td></tr>
            <tr><th className={styles.infoHeader}>担当教員</th><td>{course.teacherName}</td></tr>
            <tr><th className={styles.infoHeader}>曜日・時限</th><td>{course.dayOfWeek}曜{course.period}限</td></tr>
            <tr><th className={styles.infoHeader}>年度・学期</th><td>{course.year}年度 {course.semester}</td></tr>
          </tbody>
        </table>

        <hr className={styles.divider} />

        <h2>メッセージ一覧</h2>
        {messagesError && <p className={styles.errorText}>{messagesError}</p>}
        {/* items は古い順なので、古いぶんを継ぎ足すボタンは表の手前に置く。 */}
        {hasOlderMessages && (
          <button
            type="button"
            onClick={loadOlderMessages}
            disabled={loadingOlderMessages}
            className={styles.paginationButton}
          >
            {loadingOlderMessages ? '読み込み中...' : '過去のメッセージを読み込む'}
          </button>
        )}
        {messages.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>投稿者</th>
                <th className={styles.tableHeader}>内容</th>
                <th className={styles.tableHeader}>投稿日時</th>
                <th className={styles.tableHeader}>操作</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.ID}>
                  <td className={styles.tableCell}>
                    {message.user.name}
                    <span className={styles.accountId}>
                      @{message.user.accountID}
                    </span>
                  </td>
                  <td className={`${styles.tableCell} ${styles.contentCell}`}>
                    {message.content}
                  </td>
                  <td className={`${styles.tableCell} ${styles.nowrap}`}>
                    {new Date(message.createdAt).toLocaleString('ja-JP')}
                  </td>
                  <td className={styles.tableCell}>
                    <button onClick={() => handleDeleteMessage(message)} className={styles.dangerButton}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !messagesError && <p>メッセージはありません</p>
        )}

        <hr className={styles.divider} />

        <h2>質問箱一覧</h2>
        {questionsError && <p className={styles.errorText}>{questionsError}</p>}
        {questions.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>質問者</th>
                <th className={styles.tableHeader}>本文</th>
                <th className={styles.tableHeader}>状態</th>
                <th className={styles.tableHeader}>回答数</th>
                <th className={styles.tableHeader}>投稿日時</th>
                <th className={styles.tableHeader}>操作</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.ID}>
                  <td className={styles.tableCell}>
                    {question.user.name}
                    <span className={styles.accountId}>
                      @{question.user.accountID}
                    </span>
                  </td>
                  <td className={`${styles.tableCell} ${styles.contentCell}`}>
                    {question.body}
                  </td>
                  <td className={styles.tableCell}>
                    {question.isAnswered ? '解決済み' : '未解決'}
                  </td>
                  <td className={styles.tableCell}>{question.answerCount}</td>
                  <td className={`${styles.tableCell} ${styles.nowrap}`}>
                    {new Date(question.createdAt).toLocaleString('ja-JP')}
                  </td>
                  <td className={styles.tableCell}>
                    <button onClick={() => handleDeleteQuestion(question)} className={styles.dangerButton}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !questionsError && <p>質問はありません</p>
        )}
        <AdminPagination
          page={questionPage}
          totalPages={Math.ceil(questionTotal / adminCoursePageSize)}
          onPrev={() => setQuestionPage((p) => Math.max(0, p - 1))}
          onNext={() => setQuestionPage((p) => p + 1)}
        />

        <hr className={styles.divider} />

        <h2>投票一覧</h2>
        {pollsError && <p className={styles.errorText}>{pollsError}</p>}
        {polls.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>作成者</th>
                <th className={styles.tableHeader}>質問</th>
                <th className={styles.tableHeader}>選択肢と得票数</th>
                <th className={styles.tableHeader}>作成日時</th>
                <th className={styles.tableHeader}>操作</th>
              </tr>
            </thead>
            <tbody>
              {polls.map((poll) => (
                <tr key={poll.ID}>
                  <td className={styles.tableCell}>
                    {poll.user.name}
                    <span className={styles.accountId}>
                      @{poll.user.accountID}
                    </span>
                  </td>
                  <td className={`${styles.tableCell} ${styles.contentCellNarrow}`}>
                    {poll.question}
                  </td>
                  <td className={styles.tableCell}>
                    {poll.options.map((o) => `${o.label}(${o.voteCount})`).join(' / ')}
                  </td>
                  <td className={`${styles.tableCell} ${styles.nowrap}`}>
                    {new Date(poll.createdAt).toLocaleString('ja-JP')}
                  </td>
                  <td className={styles.tableCell}>
                    <button onClick={() => handleDeletePoll(poll)} className={styles.dangerButton}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !pollsError && <p>投票はありません</p>
        )}
        <AdminPagination
          page={pollPage}
          totalPages={Math.ceil(pollTotal / adminCoursePageSize)}
          onPrev={() => setPollPage((p) => Math.max(0, p - 1))}
          onNext={() => setPollPage((p) => p + 1)}
        />
      </main>
    </div>
  );
};
