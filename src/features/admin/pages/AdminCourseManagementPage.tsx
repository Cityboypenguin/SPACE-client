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
import styles from '../styles/AdminShared.module.css';

const LIST_PAGE_SIZE = 20;

const STATE_LABELS: Record<CourseImportStatus['state'], string> = {
  IDLE: '未実行',
  RUNNING: '実行中',
  SUCCEEDED: '成功',
  FAILED: '失敗',
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

  return (
    <div>
      <AdminHeader />
      <main className={styles.page}>
        <h1>授業管理</h1>

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <>
            {loadError && <p className={styles.errorText}>{loadError}</p>}

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>学期指定</h2>
              <div className={styles.filterForm}>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={styles.inputCompact}
                />
                <span>年</span>
                <select value={semester} onChange={(e) => setSemester(e.target.value)} className={styles.select}>
                  <option value="前期">前期</option>
                  <option value="後期">後期</option>
                </select>
              </div>
              <button
                onClick={() => { void handleSaveSemester(); }}
                disabled={savingSemester}
                className={`${styles.primaryButton} ${styles.primaryButtonLarge} ${savingSemester ? styles.disabled : ''}`}
              >
                {savingSemester ? '更新中...' : '学期を更新する'}
              </button>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>授業データの取り込み</h2>
              <div className={styles.filterForm}>
                <input
                  type="number"
                  value={importYear}
                  onChange={(e) => setImportYear(Number(e.target.value))}
                  className={styles.inputCompact}
                  disabled={status?.state === 'RUNNING'}
                />
                <span>年度をシラバスサイトから取り込む</span>
              </div>
              <button
                onClick={() => { void handleTriggerImport(); }}
                disabled={triggering || status?.state === 'RUNNING'}
                className={`${styles.primaryButton} ${styles.primaryButtonLarge} ${(triggering || status?.state === 'RUNNING') ? styles.disabled : ''}`}
              >
                {status?.state === 'RUNNING' ? '実行中...' : '取り込みを開始'}
              </button>

              {status && (
                <div className={styles.statusLine}>
                  <p>
                    状態：
                    <strong className={styles.importState} data-state={status.state}> {STATE_LABELS[status.state]}</strong>
                    {status.year != null && ` （${status.year}年度）`}
                  </p>
                  {status.state === 'SUCCEEDED' && (
                    <p className={styles.cellText}>
                      新規登録: {status.imported ?? 0}件 ・ スキップ: {status.skipped ?? 0}件
                    </p>
                  )}
                  {status.state === 'FAILED' && status.errorMessage && (
                    <p className={styles.errorText}>{status.errorMessage}</p>
                  )}
                </div>
              )}
              <p className={styles.helpText}>
                既に取り込み済みの授業は重複登録されず、新規分のみ追加されます。1回の実行に数十秒〜数分かかることがあります。
              </p>
            </div>

            <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}>
              <h2 className={styles.sectionTitle}>授業一覧</h2>
              <form
                onSubmit={handleFilterSubmit}
                className={styles.filterForm}
              >
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={styles.select}>
                  <option value="">年度（すべて）</option>
                  {courseYears.map((y) => <option key={y} value={y}>{y}年度</option>)}
                </select>
                <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className={styles.select}>
                  <option value="">学期（すべて）</option>
                  <option value="前期">前期</option>
                  <option value="後期">後期</option>
                  <option value="通年">通年</option>
                </select>
                <select value={filterDayOfWeek} onChange={(e) => setFilterDayOfWeek(e.target.value)} className={styles.select}>
                  <option value="">曜日（すべて）</option>
                  {TIMETABLE_DAYS.map((day) => <option key={day} value={day}>{day}曜</option>)}
                </select>
                <input
                  type="text"
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  placeholder="授業名・教員名で絞り込み"
                  className={`${styles.input} ${styles.inputGrow}`}
                />
                <button
                  type="submit"
                  className={styles.primaryButton}
                >
                  検索
                </button>
              </form>

              {listError && <p className={styles.errorText}>{listError}</p>}

              {listLoading ? (
                <p>読み込み中...</p>
              ) : courseItems.length === 0 ? (
                <p className={styles.mutedText}>該当する授業がありません。</p>
              ) : (
                <>
                  <p className={styles.metaText}>
                    全{courseTotal}件中 {listOffset + 1}〜{listOffset + courseItems.length}件を表示（行をクリックするとチャット内容を確認できます）
                  </p>
                  <div className={styles.tableWrap}>
                    <table className={styles.compactTable}>
                      <thead>
                        <tr className={styles.compactHeaderRow}>
                          <th className={styles.compactTableHeader}>授業名</th>
                          <th className={styles.compactTableHeader}>教員</th>
                          <th className={styles.compactTableHeader}>曜日・時限</th>
                          <th className={styles.compactTableHeader}>年度</th>
                          <th className={styles.compactTableHeader}>学期</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseItems.map((course) => (
                          <tr
                            key={course.ID}
                            onClick={() => navigate(`/admin/courses/${course.ID}`, { state: { course } })}
                            className={styles.clickableRow}
                          >
                            <td className={styles.compactTableCell}>{course.courseName}</td>
                            <td className={styles.compactTableCell}>{course.teacherName}</td>
                            <td className={styles.compactTableCell}>{course.dayOfWeek}曜{course.period}限</td>
                            <td className={styles.compactTableCell}>{course.year}</td>
                            <td className={styles.compactTableCell}>{course.semester}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.pagination}>
                    <button
                      type="button"
                      disabled={listOffset === 0}
                      onClick={() => setListOffset((prev) => Math.max(0, prev - LIST_PAGE_SIZE))}
                      className={styles.paginationButton}
                    >
                      前へ
                    </button>
                    <button
                      type="button"
                      disabled={listOffset + courseItems.length >= courseTotal}
                      onClick={() => setListOffset((prev) => prev + LIST_PAGE_SIZE)}
                      className={styles.paginationButton}
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
