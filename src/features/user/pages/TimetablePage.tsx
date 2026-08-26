import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import {
  getMyTimetable,
  getCurrentSemester,
  getCourseYears,
  setMyTimetable,
  setTimetableProfileVisibility,
  type TimetableEntry,
  type Course,
} from '../api/course';
import { stableCacheOptions, staticCacheOptions, semesterCacheOptions } from '../cache/swrOptions';
import { AppSwal } from '../../../lib/swal';
import {
  loadTimetableDraft,
  saveTimetableDraft,
  clearTimetableDraft,
  slotKey,
  type TimetableDraft,
} from '../lib/timetableDraft';
import styles from '../components/Timetable.module.css';

const DAYS = ['月', '火', '水', '木', '金', '土'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const buildDraftFromEntries = (entries: TimetableEntry[]): TimetableDraft => {
  const draft: TimetableDraft = {};
  entries.forEach((e) => {
    draft[slotKey(e.course.dayOfWeek, e.course.period)] = {
      course: e.course,
      entryID: e.ID,
      isProfileVisible: e.isProfileVisible,
    };
  });
  return draft;
};

export const TimetablePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: currentSemester } = useSWR('current-semester', () => getCurrentSemester(), semesterCacheOptions);
  const { data: courseYears } = useSWR('course-years', () => getCourseYears(), staticCacheOptions);

  // 授業チャットの「戻る」から遷移してきた場合は、開いていた時期の時間割に戻す
  // （現在の学期にリセットしない）。初回マウント時の初期値としてのみ使うので、
  // 学期セレクタ操作後の再レンダーで location.state を読み直すことはない。
  const restoreState = location.state as { year?: number; semester?: string } | null;
  const [selectedYear, setSelectedYear] = useState<number | undefined>(restoreState?.year);
  const [selectedSemester, setSelectedSemester] = useState<string | undefined>(restoreState?.semester);

  const viewYear = selectedYear ?? currentSemester?.year;
  const viewSemester = selectedSemester ?? currentSemester?.semester;

  // 現在の学期に授業がまだ取り込まれていない場合でも選択肢に出せるよう、
  // 授業が実在する年度に現在の学期の年度を加えた集合を選択肢にする。
  const yearOptions = useMemo(() => {
    const years = new Set(courseYears ?? []);
    if (currentSemester) years.add(currentSemester.year);
    return Array.from(years).sort((a, b) => b - a);
  }, [courseYears, currentSemester]);

  // 登録・削除は常に現在学期の授業検索経由で行われるため、表示中の学期が「現在の
  // 学期」と完全に一致する場合のみ編集可能とする（過去はもちろん、未来の学期を
  // 覗いた場合も検索結果と噛み合わないため編集不可にする）。
  const isEditable = !!currentSemester && viewYear === currentSemester.year && viewSemester === currentSemester.semester;

  const {
    data: entries,
    error,
    isLoading,
    mutate,
  } = useSWR(
    viewYear != null && viewSemester ? ['my-timetable', viewYear, viewSemester] : null,
    () => getMyTimetable(viewYear, viewSemester),
    stableCacheOptions,
  );

  const entryMap = useMemo(() => {
    const map = new Map<string, TimetableEntry>();
    (entries ?? []).forEach((entry) => {
      map.set(slotKey(entry.course.dayOfWeek, entry.course.period), entry);
    });
    return map;
  }, [entries]);

  const baselineCourseIDs = useMemo(() => new Set((entries ?? []).map((e) => e.course.ID)), [entries]);

  // ---- 編集モード ----
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<TimetableDraft>({});
  const [baselineEntryIDs, setBaselineEntryIDs] = useState<string[]>([]);
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState('');

  const hasChanges = useMemo(() => {
    if (!editMode) return false;
    const draftCourseIDs = new Set(Object.values(draft).map((s) => s.course.ID));
    if (draftCourseIDs.size !== baselineCourseIDs.size) return true;
    for (const id of draftCourseIDs) {
      if (!baselineCourseIDs.has(id)) return true;
    }
    return false;
  }, [editMode, draft, baselineCourseIDs]);

  const persistDraft = (nextDraft: TimetableDraft, entryIDs: string[]) => {
    if (viewYear == null || !viewSemester) return;
    saveTimetableDraft(viewYear, viewSemester, { baselineEntryIDs: entryIDs, draft: nextDraft });
  };

  const handleEnterEditMode = async () => {
    if (!entries || viewYear == null || !viewSemester) return;

    const saved = loadTimetableDraft(viewYear, viewSemester);
    if (saved) {
      const result = await AppSwal.fire({
        text: '前回の編集内容が保存されています。復元しますか？',
        confirmButtonText: '復元する',
        cancelButtonText: '破棄して最初から',
        showCancelButton: true,
      });
      if (result.isConfirmed) {
        setDraft(saved.draft);
        setBaselineEntryIDs(saved.baselineEntryIDs);
        setEditMode(true);
        return;
      }
      clearTimetableDraft(viewYear, viewSemester);
    }

    const freshDraft = buildDraftFromEntries(entries);
    const freshBaseline = entries.map((e) => e.ID);
    setDraft(freshDraft);
    setBaselineEntryIDs(freshBaseline);
    setCommitError('');
    setEditMode(true);
    persistDraft(freshDraft, freshBaseline);
  };

  const handleCancelEdit = async () => {
    if (hasChanges) {
      const result = await AppSwal.fire({
        text: '編集内容を破棄しますか？',
        confirmButtonText: '破棄する',
        cancelButtonText: '編集を続ける',
        showCancelButton: true,
      });
      if (!result.isConfirmed) return;
    }
    if (viewYear != null && viewSemester) clearTimetableDraft(viewYear, viewSemester);
    setEditMode(false);
    setCommitError('');
  };

  const handleRemoveDraftSlot = (key: string) => {
    setDraft((prev) => {
      const next = { ...prev };
      delete next[key];
      persistDraft(next, baselineEntryIDs);
      return next;
    });
  };

  const handleToggleDraftVisibility = async (key: string) => {
    const slotEntry = draft[key];
    if (!slotEntry?.entryID) return;
    const nextVisible = !slotEntry.isProfileVisible;
    await setTimetableProfileVisibility(slotEntry.entryID, nextVisible);
    setDraft((prev) => {
      const next = { ...prev, [key]: { ...prev[key], isProfileVisible: nextVisible } };
      persistDraft(next, baselineEntryIDs);
      return next;
    });
  };

  const handleCommit = async () => {
    if (viewYear == null || !viewSemester) return;
    setCommitting(true);
    setCommitError('');
    try {
      const courseIDs = Object.values(draft).map((s) => s.course.ID);
      await setMyTimetable(viewYear, viewSemester, baselineEntryIDs, courseIDs);
      clearTimetableDraft(viewYear, viewSemester);
      setEditMode(false);
      void mutate();
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : '時間割の保存に失敗しました。');
    } finally {
      setCommitting(false);
    }
  };

  const handleReloadBaseline = async () => {
    const fresh = await mutate();
    if (!fresh || viewYear == null || !viewSemester) return;
    const freshDraft = buildDraftFromEntries(fresh);
    const freshBaseline = fresh.map((e) => e.ID);
    setDraft(freshDraft);
    setBaselineEntryIDs(freshBaseline);
    setCommitError('');
    persistDraft(freshDraft, freshBaseline);
  };

  // 検索画面（ピッカー）から戻ってきた時、下書きに反映（授業を選んだ場合）または
  // 編集モードをそのまま再開（何も選ばずに「戻る」を押した場合）してから遷移状態を消費する。
  useEffect(() => {
    const state = location.state as { pickedCourse?: Course; resumeEditMode?: boolean } | null;
    if ((!state?.pickedCourse && !state?.resumeEditMode) || viewYear == null || !viewSemester) return;

    (async () => {
      const saved = loadTimetableDraft(viewYear, viewSemester);
      const baseDraft = saved?.draft ?? (entries ? buildDraftFromEntries(entries) : {});
      const baseBaseline = saved?.baselineEntryIDs ?? (entries ? entries.map((e) => e.ID) : []);

      let nextDraft = baseDraft;
      if (state.pickedCourse) {
        const course = state.pickedCourse;
        nextDraft = { ...baseDraft, [slotKey(course.dayOfWeek, course.period)]: { course } };
      }

      setDraft(nextDraft);
      setBaselineEntryIDs(baseBaseline);
      setCommitError('');
      setEditMode(true);
      persistDraft(nextDraft, baseBaseline);
      navigate(location.pathname, { replace: true, state: {} });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, viewYear, viewSemester, entries]);

  // ブラウザのリロード・タブ閉じによる下書き消失を警告する。
  useEffect(() => {
    if (!editMode || !hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editMode, hasChanges]);

  const handlePickCourse = (dayOfWeek: string, period: number) => {
    navigate('/timetable/search', { state: { dayOfWeek, period, pickerMode: true } });
  };

  return (
    <div>
      {!editMode && <UserSidebar />}
      <main className={styles.main}>
        <div className={styles.topActions}>
          <div className={styles.semesterSelector}>
            {/* 学期セレクタを操作するたびに「現在の学期」を明示的に再検証する。管理者が
                別タブ等で学期を切り替えた直後でも、ここでの選択が正しく「編集可能」
                かどうかを古いキャッシュ値で誤判定しないようにするため。 */}
            <select
              className={styles.yearSelect}
              value={viewYear ?? ''}
              disabled={editMode}
              onChange={(e) => {
                setSelectedYear(e.target.value ? Number(e.target.value) : undefined);
              }}
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span>年</span>
            <select
              className={styles.semesterSelect}
              value={viewSemester ?? ''}
              disabled={editMode}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
              }}
            >
              <option value="前期">前期</option>
              <option value="後期">後期</option>
            </select>
            {!isEditable && <span className={styles.readOnlyBadge}>閲覧のみ</span>}
          </div>
          {isEditable && !editMode && (
            <button className={styles.searchButton} onClick={() => { void handleEnterEditMode(); }}>
              時間割を編集
            </button>
          )}
          {editMode && (
            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.pickButton}
                onClick={() => navigate('/timetable/search', { state: { pickerMode: true } })}
              >
                授業を探す
              </button>
              <button type="button" className={styles.cancelButton} onClick={() => { void handleCancelEdit(); }} disabled={committing}>
                キャンセル
              </button>
              <button type="button" className={styles.commitButton} onClick={() => { void handleCommit(); }} disabled={committing}>
                {committing ? '保存中...' : '完了'}
              </button>
            </div>
          )}
        </div>

        {editMode && commitError && (
          <div className={styles.commitErrorBanner}>
            <p>{commitError}</p>
            <button type="button" onClick={() => { void handleReloadBaseline(); }}>最新の状態を読み込み直す</button>
          </div>
        )}

        {error && <p className={styles.errorText}>時間割の読み込みに失敗しました。</p>}

        {isLoading ? (
          <p className={styles.empty}>読み込み中...</p>
        ) : (
          <div className={styles.gridWrap}>
            <table className={styles.grid}>
              <thead>
                <tr>
                  <th className={styles.periodHeader} />
                  {DAYS.map((day) => <th key={day}>{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period}>
                    <td className={styles.periodCell}>{period}限</td>
                    {DAYS.map((day) => {
                      const key = slotKey(day, period);
                      if (editMode) {
                        const slot = draft[key];
                        return (
                          <td key={day} className={styles.cell}>
                            {slot ? (
                              <div className={styles.courseChip}>
                                <div className={styles.chipActions}>
                                  {slot.entryID && (
                                    <button
                                      type="button"
                                      className={`${styles.chipActionButton} ${slot.isProfileVisible ? styles.chipActionButtonActive : ''}`}
                                      title={slot.isProfileVisible ? 'プロフィールに公開中（クリックで非公開に）' : 'プロフィールに非公開（クリックで公開に）'}
                                      onClick={() => { void handleToggleDraftVisibility(key); }}
                                    >
                                      ●
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className={styles.chipActionButton}
                                    title="この授業を外す"
                                    onClick={() => handleRemoveDraftSlot(key)}
                                  >
                                    ✕
                                  </button>
                                </div>
                                {!baselineCourseIDs.has(slot.course.ID) && <span className={styles.newBadge}>NEW</span>}
                                {slot.course.semester === '通年' && <span className={styles.fullYearBadge}>通年</span>}
                                <span className={styles.courseName}>{slot.course.courseName}</span>
                                <span className={styles.teacherName}>{slot.course.teacherName}</span>
                              </div>
                            ) : (
                              <button type="button" className={styles.emptyCellButton} onClick={() => handlePickCourse(day, period)}>
                                +
                              </button>
                            )}
                          </td>
                        );
                      }

                      const entry = entryMap.get(key);
                      return (
                        <td key={day} className={styles.cell}>
                          {entry ? (
                            <div
                              className={`${styles.courseChip} ${styles.courseChipClickable} ${!isEditable ? styles.courseChipReadOnly : ''}`}
                              onClick={() => navigate(`/courses/chat/${entry.course.roomID}`, { state: { course: entry.course } })}
                            >
                              {entry.course.semester === '通年' && <span className={styles.fullYearBadge}>通年</span>}
                              <span className={styles.courseName}>{entry.course.courseName}</span>
                              <span className={styles.teacherName}>{entry.course.teacherName}</span>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
