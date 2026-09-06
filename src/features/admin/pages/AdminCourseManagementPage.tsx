import { useCallback, useEffect, useState } from 'react';
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
  createCourse,
  deleteCourse,
  type CourseImportStatus,
  type Course,
} from '../api/courses';
import { subscribeToAdminGraphQL } from '../api/adminGraphqlWs';
import { TIMETABLE_DAYS, TIMETABLE_PERIODS } from '../../user/components/timetableConstants';
import styles from '../styles/AdminShared.module.css';

const LIST_PAGE_SIZE = 20;

const STATE_LABELS: Record<CourseImportStatus['state'], string> = {
  IDLE: '未実行',
  RUNNING: '実行中',
  SUCCEEDED: '成功',
  FAILED: '失敗',
};

const ADMIN_COURSE_IMPORT_STATUS_UPDATED_SUBSCRIPTION = `
  subscription AdminCourseImportStatusUpdated {
    adminCourseImportStatusUpdated {
      state
      year
      imported
      skipped
      errorMessage
      startedAt
      finishedAt
      processedCount
      totalCount
      progressPercent
    }
  }
`;

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

  const [newDayOfWeek, setNewDayOfWeek] = useState(TIMETABLE_DAYS[0]);
  const [newPeriod, setNewPeriod] = useState(TIMETABLE_PERIODS[0]);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newSemester, setNewSemester] = useState('前期');
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  const refetchCourseList = useCallback(async () => {
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
  }, [appliedFilter, listOffset]);

  useEffect(() => {
    (async () => {
      await refetchCourseList();
    })();
  }, [refetchCourseList]);

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

  // 取り込みが動いている間だけWebSocketを張る。ボタン押下で開始した場合はもちろん、
  // ページを開いた時点で既にRUNNINGだった場合(別の管理者が実行中/リロードした場合)も
  // 直前のuseEffectで取得した初期状態をきっかけに接続される。SUCCEEDED/FAILEDに
  // なった時点でこのeffectのクリーンアップが走り、切断される。
  useEffect(() => {
    if (status?.state !== 'RUNNING') return;
    const unsubscribe = subscribeToAdminGraphQL<{ adminCourseImportStatusUpdated: CourseImportStatus }>(
      ADMIN_COURSE_IMPORT_STATUS_UPDATED_SUBSCRIPTION,
      {},
      (data) => {
        const next = data.adminCourseImportStatusUpdated;
        setStatus(next);
        if (next.state === 'SUCCEEDED') {
          addToast(`取り込みが完了しました（新規${next.imported ?? 0}件・スキップ${next.skipped ?? 0}件）`, 'success');
        } else if (next.state === 'FAILED') {
          addToast(next.errorMessage ?? '取り込みに失敗しました', 'error');
        }
      },
      (err) => console.error('[AdminCourseManagementPage] import status subscription error:', err),
    );
    return unsubscribe;
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

  const handleCreateCourse = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newCourseName.trim()) {
      addToast('教員名・授業名は必須です', 'error');
      return;
    }
    setCreatingCourse(true);
    try {
      await createCourse({
        dayOfWeek: newDayOfWeek,
        period: newPeriod,
        teacherName: newTeacherName.trim(),
        courseName: newCourseName.trim(),
        year: newYear,
        semester: newSemester,
      });
      addToast('授業を追加しました', 'success');
      setNewTeacherName('');
      setNewCourseName('');
      await refetchCourseList();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '授業の追加に失敗しました', 'error');
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleDeleteCourse = async (course: Course, e: { stopPropagation(): void }) => {
    e.stopPropagation();
    const warning = course.registeredCount > 0
      ? `この授業は${course.registeredCount}人が時間割に登録しています。削除するとその登録・チャット履歴（メッセージ・質問・投票）が全て失われます。`
      : 'この授業を削除すると、チャット履歴も全て失われます。';
    if (!window.confirm(`「${course.courseName}」を削除しますか？\n${warning}\nこの操作は取り消せません。`)) return;

    setDeletingCourseId(course.ID);
    try {
      await deleteCourse(course.ID);
      addToast('授業を削除しました', 'success');
      await refetchCourseList();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '授業の削除に失敗しました', 'error');
    } finally {
      setDeletingCourseId(null);
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
                  {status.state === 'RUNNING' && status.progressPercent != null && (
                    <p className={styles.cellText}>
                      進捗: {status.progressPercent}%（{status.processedCount ?? 0} / {status.totalCount ?? 0}件）
                    </p>
                  )}
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

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>授業を手動で追加</h2>
              <form onSubmit={(e) => { void handleCreateCourse(e); }} className={styles.filterForm}>
                <select value={newDayOfWeek} onChange={(e) => setNewDayOfWeek(e.target.value)} className={styles.select}>
                  {TIMETABLE_DAYS.map((day) => <option key={day} value={day}>{day}曜</option>)}
                </select>
                <select value={newPeriod} onChange={(e) => setNewPeriod(Number(e.target.value))} className={styles.select}>
                  {TIMETABLE_PERIODS.map((p) => <option key={p} value={p}>{p}限</option>)}
                </select>
                <select value={newSemester} onChange={(e) => setNewSemester(e.target.value)} className={styles.select}>
                  <option value="前期">前期</option>
                  <option value="後期">後期</option>
                  <option value="通年">通年</option>
                </select>
                <input
                  type="number"
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className={styles.inputCompact}
                />
                <input
                  type="text"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="教員名"
                  className={styles.input}
                />
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="授業名"
                  className={`${styles.input} ${styles.inputGrow}`}
                />
                <button type="submit" disabled={creatingCourse} className={styles.primaryButton}>
                  {creatingCourse ? '追加中...' : '追加する'}
                </button>
              </form>
              <p className={styles.helpText}>
                スクレイピングが拾わなかった授業の緊急追加用です。追加すると専用のチャットルームも作られます。
                後日スクレイピングで同じ授業が取り込まれると重複登録される点に注意してください。
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
                          <th className={styles.compactTableHeader}>登録者数</th>
                          <th className={styles.compactTableHeader}></th>
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
                            <td className={styles.compactTableCell}>{course.registeredCount}人</td>
                            <td className={styles.compactTableCell}>
                              <button
                                type="button"
                                disabled={deletingCourseId === course.ID}
                                onClick={(e) => { void handleDeleteCourse(course, e); }}
                                className={`${styles.dangerButtonSmall} ${deletingCourseId === course.ID ? styles.disabled : ''}`}
                              >
                                {deletingCourseId === course.ID ? '削除中...' : '削除'}
                              </button>
                            </td>
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
