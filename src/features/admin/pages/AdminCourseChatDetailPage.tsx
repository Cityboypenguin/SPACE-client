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

  if (!course) return <p style={{ padding: '2rem' }}>{error || '読み込み中...'}</p>;

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <button onClick={() => navigate('/admin/courses')}><ChevronLeft /> 一覧に戻る</button>
        <h1>授業チャット詳細</h1>

        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <table style={{ marginBottom: '1rem' }}>
          <tbody>
            <tr><th style={{ textAlign: 'left', paddingRight: '1rem' }}>授業名</th><td>{course.courseName}</td></tr>
            <tr><th style={{ textAlign: 'left', paddingRight: '1rem' }}>担当教員</th><td>{course.teacherName}</td></tr>
            <tr><th style={{ textAlign: 'left', paddingRight: '1rem' }}>曜日・時限</th><td>{course.dayOfWeek}曜{course.period}限</td></tr>
            <tr><th style={{ textAlign: 'left', paddingRight: '1rem' }}>年度・学期</th><td>{course.year}年度 {course.semester}</td></tr>
          </tbody>
        </table>

        <hr style={{ margin: '2rem 0' }} />

        <h2>メッセージ一覧</h2>
        {messagesError && <p style={{ color: 'var(--color-danger)' }}>{messagesError}</p>}
        {messages.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>投稿者</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>内容</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>投稿日時</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.ID}>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    {message.user.name}
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                      @{message.user.accountID}
                    </span>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', maxWidth: '400px', wordBreak: 'break-word' }}>
                    {message.content}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    {new Date(message.createdAt).toLocaleString('ja-JP')}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    <button onClick={() => handleDeleteMessage(message)} style={{ color: 'var(--color-danger)' }}>
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

        <hr style={{ margin: '2rem 0' }} />

        <h2>質問箱一覧</h2>
        {questionsError && <p style={{ color: 'var(--color-danger)' }}>{questionsError}</p>}
        {questions.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>質問者</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>本文</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>状態</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>回答数</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>投稿日時</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.ID}>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    {question.user.name}
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                      @{question.user.accountID}
                    </span>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', maxWidth: '400px', wordBreak: 'break-word' }}>
                    {question.body}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    {question.isAnswered ? '解決済み' : '未解決'}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>{question.answers.length}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    {new Date(question.createdAt).toLocaleString('ja-JP')}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    <button onClick={() => handleDeleteQuestion(question)} style={{ color: 'var(--color-danger)' }}>
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

        <hr style={{ margin: '2rem 0' }} />

        <h2>投票一覧</h2>
        {pollsError && <p style={{ color: 'var(--color-danger)' }}>{pollsError}</p>}
        {polls.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>作成者</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>質問</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>選択肢と得票数</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>作成日時</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--color-border)' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {polls.map((poll) => (
                <tr key={poll.ID}>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    {poll.user.name}
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                      @{poll.user.accountID}
                    </span>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', maxWidth: '300px', wordBreak: 'break-word' }}>
                    {poll.question}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    {poll.options.map((o) => `${o.label}(${o.voteCount})`).join(' / ')}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                    {new Date(poll.createdAt).toLocaleString('ja-JP')}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    <button onClick={() => handleDeletePoll(poll)} style={{ color: 'var(--color-danger)' }}>
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
