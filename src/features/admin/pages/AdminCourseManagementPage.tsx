import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { useToast } from '../../../context/useToast';
import {
  getCurrentSemester,
  updateCurrentSemester,
  getCourseImportStatus,
  triggerCourseImport,
  listCourses,
  listCourseYears,
  type CourseImportStatus,
  type Course,
} from '../api/courses';
import { TIMETABLE_DAYS } from '../../user/components/timetableConstants';

const LIST_PAGE_SIZE = 20;

const STATE_LABELS: Record<CourseImportStatus['state'], string> = {
  IDLE: '未実行',
  RUNNING: '実行中',
  SUCCEEDED: '成功',
  FAILED: '失敗',
};

const STATE_COLORS: Record<CourseImportStatus['state'], string> = {
  IDLE: '#94a3b8',
  RUNNING: '#2563eb',
  SUCCEEDED: '#27ae60',
  FAILED: '#c0392b',
};

const POLL_INTERVAL_MS = 3000;

export const AdminCourseManagementPage = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [year, setYear] = useState(new Date().getFullYear());
  const [semester, setSemester] = useState('前期');
  const [savingSemester, setSavingSemester] = useState(false);

  const [importYear, setImportYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<CourseImportStatus | null>(null);
  const [triggering, setTriggering] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [courseYears, setCourseYears] = useState<number[]>([]);
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterDayOfWeek, setFilterDayOfWeek] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [appliedFilter, setAppliedFilter] = useState<{ year?: number; semester?: string; dayOfWeek?: string; keyword?: string }>({});
  const [listOffset, setListOffset] = useState(0);
  const [courseItems, setCourseItems] = useState<Course[]>([]);
  const [courseTotal, setCourseTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  useEffect(() => {
    (async () => {
      setListLoading(true);
      setListError('');
      try {
        const data = await listCourses(appliedFilter, LIST_PAGE_SIZE, listOffset);
        setCourseItems(data.items);
        setCourseTotal(data.total);
      } catch (err) {
        setListError(err instanceof Error ? err.message : '授業一覧の取得に失敗しました');
      } finally {
        setListLoading(false);
      }
    })();
  }, [appliedFilter, listOffset]);

  const handleFilterSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setListOffset(0);
    setAppliedFilter({
      year: filterYear ? Number(filterYear) : undefined,
      semester: filterSemester || undefined,
      dayOfWeek: filterDayOfWeek || undefined,
      keyword: filterKeyword.trim() || undefined,
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const [currentSemester, importStatus, years] = await Promise.all([
          getCurrentSemester(),
          getCourseImportStatus(),
          listCourseYears(),
        ]);
        setYear(currentSemester.year);
        setSemester(currentSemester.semester);
        setImportYear(currentSemester.year);
        setStatus(importStatus);
        setCourseYears(years);
      } catch {
        setLoadError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (status?.state !== 'RUNNING') {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }
    pollTimerRef.current = setInterval(async () => {
      try {
        const next = await getCourseImportStatus();
        setStatus(next);
        if (next.state === 'SUCCEEDED') {
          addToast(`取り込みが完了しました（新規${next.imported ?? 0}件・スキップ${next.skipped ?? 0}件）`, 'success');
        } else if (next.state === 'FAILED') {
          addToast(next.errorMessage ?? '取り込みに失敗しました', 'error');
        }
      } catch {
        // 次回のポーリングで再試行する
      }
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [status?.state, addToast]);

  const handleSaveSemester = async () => {
    if (!window.confirm(`現在の学期を「${year}年 ${semester}」に変更しますか？\n全ての授業チャットの書き込み可否に影響します。`)) return;
    setSavingSemester(true);
    try {
      await updateCurrentSemester(year, semester);
      addToast('学期を更新しました', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '学期の更新に失敗しました', 'error');
    } finally {
      setSavingSemester(false);
    }
  };

  const handleTriggerImport = async () => {
    setTriggering(true);
    try {
      const next = await triggerCourseImport(importYear);
      setStatus(next);
      addToast('取り込みを開始しました', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : '取り込みの開始に失敗しました', 'error');
    } finally {
      setTriggering(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    marginTop: '1.5rem',
    padding: '1.5rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    maxWidth: '520px',
  };

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <h1>授業管理</h1>

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <>
            {loadError && <p style={{ color: 'red' }}>{loadError}</p>}

            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>学期指定</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  style={{ width: '90px', padding: '0.4rem 0.6rem' }}
                />
                <span>年</span>
                <select value={semester} onChange={(e) => setSemester(e.target.value)} style={{ padding: '0.4rem 0.6rem' }}>
                  <option value="前期">前期</option>
                  <option value="後期">後期</option>
                </select>
              </div>
              <button
                onClick={() => { void handleSaveSemester(); }}
                disabled={savingSemester}
                style={{
                  padding: '0.6rem 1.4rem',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: savingSemester ? 'not-allowed' : 'pointer',
                  opacity: savingSemester ? 0.7 : 1,
                }}
              >
                {savingSemester ? '更新中...' : '学期を更新する'}
              </button>
            </div>

            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>授業データの取り込み</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="number"
                  value={importYear}
                  onChange={(e) => setImportYear(Number(e.target.value))}
                  style={{ width: '90px', padding: '0.4rem 0.6rem' }}
                  disabled={status?.state === 'RUNNING'}
                />
                <span>年度をシラバスサイトから取り込む</span>
              </div>
              <button
                onClick={() => { void handleTriggerImport(); }}
                disabled={triggering || status?.state === 'RUNNING'}
                style={{
                  padding: '0.6rem 1.4rem',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (triggering || status?.state === 'RUNNING') ? 'not-allowed' : 'pointer',
                  opacity: (triggering || status?.state === 'RUNNING') ? 0.7 : 1,
                }}
              >
                {status?.state === 'RUNNING' ? '実行中...' : '取り込みを開始'}
              </button>

              {status && (
                <div style={{ marginTop: '1.25rem', fontSize: '0.9rem' }}>
                  <p style={{ margin: '0 0 0.4rem' }}>
                    状態：
                    <strong style={{ color: STATE_COLORS[status.state] }}> {STATE_LABELS[status.state]}</strong>
                    {status.year != null && ` （${status.year}年度）`}
                  </p>
                  {status.state === 'SUCCEEDED' && (
                    <p style={{ margin: '0 0 0.4rem', color: '#475569' }}>
                      新規登録: {status.imported ?? 0}件 ・ スキップ: {status.skipped ?? 0}件
                    </p>
                  )}
                  {status.state === 'FAILED' && status.errorMessage && (
                    <p style={{ margin: '0 0 0.4rem', color: '#c0392b' }}>{status.errorMessage}</p>
                  )}
                </div>
              )}
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#888' }}>
                既に取り込み済みの授業は重複登録されず、新規分のみ追加されます。1回の実行に数十秒〜数分かかることがあります。
              </p>
            </div>

            <div style={{ ...cardStyle, maxWidth: '900px' }}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>授業一覧</h2>
              <form
                onSubmit={handleFilterSubmit}
                style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}
              >
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ padding: '0.4rem 0.6rem' }}>
                  <option value="">年度（すべて）</option>
                  {courseYears.map((y) => <option key={y} value={y}>{y}年度</option>)}
                </select>
                <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} style={{ padding: '0.4rem 0.6rem' }}>
                  <option value="">学期（すべて）</option>
                  <option value="前期">前期</option>
                  <option value="後期">後期</option>
                  <option value="通年">通年</option>
                </select>
                <select value={filterDayOfWeek} onChange={(e) => setFilterDayOfWeek(e.target.value)} style={{ padding: '0.4rem 0.6rem' }}>
                  <option value="">曜日（すべて）</option>
                  {TIMETABLE_DAYS.map((day) => <option key={day} value={day}>{day}曜</option>)}
                </select>
                <input
                  type="text"
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  placeholder="授業名・教員名で絞り込み"
                  style={{ padding: '0.4rem 0.6rem', flex: '1 1 180px' }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1.2rem',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  検索
                </button>
              </form>

              {listError && <p style={{ color: '#c0392b' }}>{listError}</p>}

              {listLoading ? (
                <p>読み込み中...</p>
              ) : courseItems.length === 0 ? (
                <p style={{ color: '#888' }}>該当する授業がありません。</p>
              ) : (
                <>
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 0.5rem' }}>
                    全{courseTotal}件中 {listOffset + 1}〜{listOffset + courseItems.length}件を表示（行をクリックするとチャット内容を確認できます）
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem' }}>授業名</th>
                          <th style={{ padding: '0.5rem' }}>教員</th>
                          <th style={{ padding: '0.5rem' }}>曜日・時限</th>
                          <th style={{ padding: '0.5rem' }}>年度</th>
                          <th style={{ padding: '0.5rem' }}>学期</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseItems.map((course) => (
                          <tr
                            key={course.ID}
                            onClick={() => navigate(`/admin/courses/${course.ID}`, { state: { course } })}
                            style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}
                          >
                            <td style={{ padding: '0.5rem' }}>{course.courseName}</td>
                            <td style={{ padding: '0.5rem' }}>{course.teacherName}</td>
                            <td style={{ padding: '0.5rem' }}>{course.dayOfWeek}曜{course.period}限</td>
                            <td style={{ padding: '0.5rem' }}>{course.year}</td>
                            <td style={{ padding: '0.5rem' }}>{course.semester}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      disabled={listOffset === 0}
                      onClick={() => setListOffset((prev) => Math.max(0, prev - LIST_PAGE_SIZE))}
                      style={{ padding: '0.4rem 1rem', cursor: listOffset === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      前へ
                    </button>
                    <button
                      type="button"
                      disabled={listOffset + courseItems.length >= courseTotal}
                      onClick={() => setListOffset((prev) => prev + LIST_PAGE_SIZE)}
                      style={{
                        padding: '0.4rem 1rem',
                        cursor: listOffset + courseItems.length >= courseTotal ? 'not-allowed' : 'pointer',
                      }}
                    >
                      次へ
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
