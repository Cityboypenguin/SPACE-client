import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { listRoomMessages, adminDeleteMessage, type Message } from '../api/communities';
import {
  getCourse,
  getCourseQuestions,
  adminDeleteQuestion,
  getCoursePolls,
  adminDeletePoll,
  type Course,
  type Question,
  type Poll,
} from '../api/courses';
import { AdminHeader } from '../components/organisms/AdminHeader';
import styles from './AdminPageStyles.module.css';

export const AdminCourseChatDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [course, setCourse] = useState<Course | null>(
    (location.state as { course?: Course })?.course ?? null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
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
    } catch {
      setMessagesError('メッセージ一覧の取得に失敗しました');
    }
  }, []);

  const fetchQuestions = useCallback(async (roomID: string) => {
    try {
      const data = await getCourseQuestions(roomID);
      setQuestions(data.items);
    } catch {
      setQuestionsError('質問一覧の取得に失敗しました');
    }
  }, []);

  const fetchPolls = useCallback(async (roomID: string) => {
    try {
      const data = await getCoursePolls(roomID);
      setPolls(data.items);
    } catch {
      setPollsError('投票一覧の取得に失敗しました');
    }
  }, []);

  useEffect(() => {
    if (!course) void Promise.resolve().then(fetchCourse);
  }, [course, fetchCourse]);

  useEffect(() => {
    if (course?.roomID) {
      void Promise.resolve().then(() => {
        fetchMessages(course.roomID);
        fetchQuestions(course.roomID);
        fetchPolls(course.roomID);
      });
    }
  }, [course?.roomID, fetchMessages, fetchQuestions, fetchPolls]);

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
    } catch {
      setError('質問の削除に失敗しました');
    }
  };

  const handleDeletePoll = async (poll: Poll) => {
    if (!window.confirm('この投票を削除しますか？')) return;
    try {
      await adminDeletePoll(poll.ID);
      setPolls((prev) => prev.filter((p) => p.ID !== poll.ID));
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
                  <td className={styles.tableCell}>{question.answers.length}</td>
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
      </main>
    </div>
  );
};
