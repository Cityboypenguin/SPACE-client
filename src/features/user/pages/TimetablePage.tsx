import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import {
  getMyTimetable,
  getCurrentSemester,
  getCourseYears,
  setMyTimetable,
  setTimetableEntryColor,
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
import { TIMETABLE_COLOR_PALETTE, getTimetableColorSwatch, type TimetableEntryColor } from '../lib/timetableColors';
import styles from '../components/Timetable.module.css';

const DAYS = ['月', '火', '水', '木', '金', '土'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];
const PERIOD_TIMES: Record<number, string[]> = {
  1: ['9:00', '10:30'],
  2: ['10:45', '12:15'],
  3: ['13:05', '14:35'],
  4: ['14:50', '16:20'],
  5: ['16:35', '18:05'],
  6: ['18:35', '19:45'],
  7: ['19:55', '21:25'],
};

const buildDraftFromEntries = (entries: TimetableEntry[]): TimetableDraft => {
  const draft: TimetableDraft = {};
  entries.forEach((e) => {
    draft[slotKey(e.course.dayOfWeek, e.course.period)] = {
      course: e.course,
      entryID: e.ID,
      color: e.color,
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
  const [colorPickerKey, setColorPickerKey] = useState<string | null>(null);
  const [colorPickerPosition, setColorPickerPosition] = useState<CSSProperties | null>(null);
  const [mobileDay, setMobileDay] = useState(DAYS[0]);

  const hasChanges = useMemo(() => {
    if (!editMode) return false;
    const draftCourseIDs = new Set(Object.values(draft).map((s) => s.course.ID));
    if (draftCourseIDs.size !== baselineCourseIDs.size) return true;
    for (const id of draftCourseIDs) {
      if (!baselineCourseIDs.has(id)) return true;
    }
    for (const [key, slot] of Object.entries(draft)) {
      const baselineEntry = entryMap.get(key);
      if (baselineEntry && slot.color !== baselineEntry.color) return true;
    }
    return false;
  }, [editMode, draft, baselineCourseIDs, entryMap]);

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

  const handleSetDraftColor = async (key: string, color: TimetableEntryColor) => {
    setColorPickerKey(null);
    setColorPickerPosition(null);
    setDraft((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev, [key]: { ...prev[key], color } };
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
      const savedEntries = await setMyTimetable(viewYear, viewSemester, baselineEntryIDs, courseIDs);
      await Promise.all(
        savedEntries
          .map((entry) => {
            const draftSlot = draft[slotKey(entry.course.dayOfWeek, entry.course.period)];
            return draftSlot?.color && draftSlot.color !== entry.color
              ? setTimetableEntryColor(entry.ID, draftSlot.color)
              : null;
          })
          .filter((request): request is Promise<TimetableEntry> => request !== null),
      );
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

  // 色選択ポップオーバーの外側をクリックしたら閉じる。
  useEffect(() => {
    if (!colorPickerKey) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-color-picker-key]')) {
        setColorPickerKey(null);
        setColorPickerPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [colorPickerKey]);

  useEffect(() => {
    if (!colorPickerKey) return;
    const closeColorPicker = () => {
      setColorPickerKey(null);
      setColorPickerPosition(null);
    };
    window.addEventListener('resize', closeColorPicker);
    window.addEventListener('scroll', closeColorPicker, true);
    return () => {
      window.removeEventListener('resize', closeColorPicker);
      window.removeEventListener('scroll', closeColorPicker, true);
    };
  }, [colorPickerKey]);

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

  const handleToggleColorPicker = (key: string, button: HTMLButtonElement) => {
    if (colorPickerKey === key) {
      setColorPickerKey(null);
      setColorPickerPosition(null);
      return;
    }

    const rect = button.getBoundingClientRect();
    const viewportMargin = 8;
    const buttonGap = 10;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const width = isMobile ? 116 : 184;
    const height = isMobile ? 64 : 44;
    const left = Math.min(
      Math.max(viewportMargin, rect.left - width - buttonGap),
      window.innerWidth - width - viewportMargin,
    );
    const top = Math.min(
      Math.max(viewportMargin, rect.top + rect.height / 2 - height / 2),
      window.innerHeight - height - viewportMargin,
    );

    setColorPickerKey(key);
    setColorPickerPosition({ top, left, width });
  };

  const renderSlotContent = (day: string, period: number) => {
    const key = slotKey(day, period);

    if (editMode) {
      const slot = draft[key];
      const swatch = getTimetableColorSwatch(slot?.color);
      return slot ? (
        <div
          className={styles.courseChip}
          style={{ '--chip-bg': swatch.bg } as CSSProperties}
        >
          <div className={styles.chipActions}>
            <div
              className={`${styles.colorPickerWrap} ${day === '土' ? styles.colorPickerWrapEdge : ''}`}
              data-color-picker-key={key}
            >
              <button
                type="button"
                className={styles.colorSwatchButton}
                style={{ '--selected-color': swatch.bg } as CSSProperties}
                title="色を変更"
                onClick={(e) => handleToggleColorPicker(key, e.currentTarget)}
              />
              {colorPickerKey === key && (
                <div
                  className={`${styles.colorPickerPopover} ${styles.colorPickerPopoverFloating}`}
                  style={colorPickerPosition ?? undefined}
                >
                  {TIMETABLE_COLOR_PALETTE.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      className={styles.colorDot}
                      style={{ background: s.bg }}
                      title={s.label}
                      onClick={() => { void handleSetDraftColor(key, s.key); }}
                    />
                  ))}
                </div>
              )}
            </div>
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
      );
    }

    const entry = entryMap.get(key);
    const viewSwatch = entry ? getTimetableColorSwatch(entry.color) : null;
    return entry ? (
      <div
        className={`${styles.courseChip} ${styles.courseChipClickable} ${!isEditable ? styles.courseChipReadOnly : ''}`}
        style={{ '--chip-bg': viewSwatch!.bg } as CSSProperties}
        onClick={() => navigate(`/courses/chat/${entry.course.roomID}`, { state: { course: entry.course, year: viewYear, semester: viewSemester } })}
      >
        {entry.course.semester === '通年' && <span className={styles.fullYearBadge}>通年</span>}
        <span className={styles.courseName}>{entry.course.courseName}</span>
        <span className={styles.teacherName}>{entry.course.teacherName}</span>
      </div>
    ) : (
      <div className={styles.emptySlot} />
    );
  };

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.topActions}>
          <h1 className={styles.title}>時間割</h1>
          <div className={styles.topControls}>
            {!editMode && (
              <>
                <div className={styles.semesterSelector}>
                  {/* 学期セレクタを操作するたびに「現在の学期」を明示的に再検証する。管理者が
                      別タブ等で学期を切り替えた直後でも、ここでの選択が正しく「編集可能」
                      かどうかを古いキャッシュ値で誤判定しないようにするため。 */}
                  <select
                    className={styles.yearSelect}
                    value={viewYear ?? ''}
                    onChange={(e) => {
                      setSelectedYear(e.target.value ? Number(e.target.value) : undefined);
                    }}
                  >
                    {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <div className={styles.semesterSlider} data-semester={viewSemester === '後期' ? 'late' : 'early'}>
                    {(['前期', '後期'] as const).map((semester) => (
                      <button
                        key={semester}
                        type="button"
                        className={`${styles.semesterOption} ${viewSemester === semester ? styles.semesterOptionActive : ''}`}
                        onClick={() => setSelectedSemester(semester)}
                      >
                        {semester}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.viewStateAction}>
                  {!isEditable ? (
                    <span className={styles.readOnlyBadge}>閲覧のみ</span>
                  ) : (
                    <button className={styles.searchButton} onClick={() => { void handleEnterEditMode(); }}>
                      時間割を編集
                    </button>
                  )}
                </div>
              </>
            )}
            {editMode && (
              <div className={styles.editActions}>
                <button type="button" className={styles.cancelButton} onClick={() => { void handleCancelEdit(); }} disabled={committing}>
                  キャンセル
                </button>
                <button type="button" className={styles.commitButton} onClick={() => { void handleCommit(); }} disabled={committing}>
                  {committing ? '保存中...' : '保存'}
                </button>
              </div>
            )}
          </div>
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
                    <td className={styles.periodCell}>
                      <span className={styles.periodNumber}>{period}</span>
                      <span className={styles.periodTime}>
                        {PERIOD_TIMES[period].map((time) => <span key={time}>{time}</span>)}
                      </span>
                    </td>
                    {DAYS.map((day) => {
                      return (
                        <td key={day} className={styles.cell}>
                          {renderSlotContent(day, period)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && (
          <div className={styles.mobileTimetable}>
            <div className={styles.mobileDayTabs}>
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`${styles.mobileDayButton} ${mobileDay === day ? styles.mobileDayButtonActive : ''}`}
                  onClick={() => setMobileDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
            <div className={styles.mobileDayList}>
              {PERIODS.map((period) => (
                <div key={period} className={styles.mobilePeriodRow}>
                  <div className={styles.mobilePeriodMeta}>
                    <span className={styles.periodNumber}>{period}</span>
                    <span className={styles.periodTime}>
                      {PERIOD_TIMES[period].map((time) => <span key={time}>{time}</span>)}
                    </span>
                  </div>
                  <div className={styles.mobileSlot}>
                    {renderSlotContent(mobileDay, period)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
