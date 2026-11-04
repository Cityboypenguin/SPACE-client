import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
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
import { AdminAddendumList } from '../components/molecules/AdminAddendumList';
import { AdminPagination } from '../components/molecules/AdminPagination';
import { AdminThreadSection } from '../components/molecules/AdminThreadSection';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminChatView } from '../components/organisms/AdminChatView';
import styles from '../styles/AdminShared.module.css';

export const AdminCourseChatDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [course, setCourse] = useState<Course | null>(
    (location.state as { course?: Course })?.course ?? null,
  );

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionPage, setQuestionPage] = useState(0);
  const [questionTotal, setQuestionTotal] = useState(0);

  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollPage, setPollPage] = useState(0);
  const [pollTotal, setPollTotal] = useState(0);
  const [error, setError] = useState('');
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
      void Promise.resolve().then(() => fetchQuestions(course.roomID, questionPage));
    }
  }, [course?.roomID, questionPage, fetchQuestions]);

  useEffect(() => {
    if (course?.roomID) {
      void Promise.resolve().then(() => fetchPolls(course.roomID, pollPage));
    }
  }, [course?.roomID, pollPage, fetchPolls]);

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

  if (!course) return <p className={styles.loadingText}>{error || '読み込み中...'}</p>;

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>授業チャット詳細</h1>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <button
            type="button"
            onClick={() => navigate('/admin/course-chats')}
            className={styles.backButton}
          >
            <ChevronLeft /> 一覧に戻る
          </button>

        {/* 2カラムレイアウトコンテナ */}
        <div className={`${styles.twoColumnLayout} ${styles.courseChatLayout}`}>
          
          {/* 【左カラム】授業情報 / 質問箱 / 投票 */}
          <div className={styles.leftColumn}>
            
            {/* 1. 授業基本情報 */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>授業情報</h2>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <th>授業名</th>
                    <td>{course.courseName}</td>
                  </tr>
                  <tr>
                    <th>担当教員</th>
                    <td>{course.teacherName}</td>
                  </tr>
                  <tr>
                    <th>曜日・時限</th>
                    <td>{course.dayOfWeek}曜{course.period}限</td>
                  </tr>
                  <tr>
                    <th>年度・学期</th>
                    <td>{course.year}年度 {course.semester}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. 質問箱一覧 */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>質問箱一覧</h2>
              {questionsError && <p className={styles.errorText}>{questionsError}</p>}
              {questions.length > 0 ? (
                <>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>質問者</th>
                          <th>本文</th>
                          <th>状態</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions.map((question) => (
                          <tr key={question.ID}>
                            <td>
                              <div>{question.user.name}</div>
                              <span className={styles.subText}>@{question.user.accountID}</span>
                            </td>
                            <td className={styles.cellWrap}>
                              {question.body}
                              <AdminAddendumList
                                questionID={question.ID}
                                addenda={question.addenda}
                                answerCount={question.answerCount}
                                onQuestionAddendaChange={(addenda) => setQuestions((prev) => prev.map((q) => (q.ID === question.ID ? { ...q, addenda } : q)))}
                                onError={setQuestionsError}
                              />
                            </td>
                            <td>{question.isAnswered ? '解決済み' : '未解決'}</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(question)}
                                className={styles.dangerButton}
                              >
                                削除
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <AdminPagination
                    page={questionPage}
                    totalPages={Math.ceil(questionTotal / adminCoursePageSize)}
                    onPrev={() => setQuestionPage((p) => Math.max(0, p - 1))}
                    onNext={() => setQuestionPage((p) => p + 1)}
                  />
                </>
              ) : (
                !questionsError && <p className={styles.emptyText}>質問はありません</p>
              )}
            </div>

            {/* 3. 投票一覧 */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>投票一覧</h2>
              {pollsError && <p className={styles.errorText}>{pollsError}</p>}
              {polls.length > 0 ? (
                <>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>作成者</th>
                          <th>質問</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {polls.map((poll) => (
                          <tr key={poll.ID}>
                            <td>
                              <div>{poll.user.name}</div>
                              <span className={styles.subText}>@{poll.user.accountID}</span>
                            </td>
                            <td className={styles.cellWrap}>{poll.question}</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleDeletePoll(poll)}
                                className={styles.dangerButton}
                              >
                                削除
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <AdminPagination
                    page={pollPage}
                    totalPages={Math.ceil(pollTotal / adminCoursePageSize)}
                    onPrev={() => setPollPage((p) => Math.max(0, p - 1))}
                    onNext={() => setPollPage((p) => p + 1)}
                  />
                </>
              ) : (
                !pollsError && <p className={styles.emptyText}>投票はありません</p>
              )}
            </div>

          </div>

          {/* 【右カラム】チャット履歴（ユーザー側のチャット画面と同じ見た目）とスレッド */}
          <div className={`${styles.rightColumn} ${styles.courseChatColumn}`}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>チャット履歴</h2>
              <AdminChatView
                key={course.roomID}
                roomID={course.roomID}
                onOpenThread={(threadID) => navigate(`/admin/courses/${id}/threads/${encodeURIComponent(threadID)}`)}
              />
            </div>

            <AdminThreadSection parentRoomID={course.roomID} basePath={`/admin/courses/${id}`} />
          </div>

        </div>
      </main>
    </div>
  );
};
