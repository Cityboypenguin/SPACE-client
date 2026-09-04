import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import useSWR from 'swr';
import { TimetableGrid } from '../TimetableGrid';
import {
  getCourseYears,
  getCurrentSemester,
  getMyTimetable,
  getUserTimetable,
  type TimetableEntry,
} from '../../api/course';
import { stableCacheOptions, staticCacheOptions, semesterCacheOptions } from '../../cache/swrOptions';
import { slotKey } from '../../lib/timetableDraft';
import { getTimetableColorSwatch } from '../../lib/timetableColors';
import timetableStyles from '../Timetable.module.css';
import styles from './PublicTimetableOverlay.module.css';

type Props = {
  userId: string;
  userName: string;
  isMe: boolean;
  onClose: () => void;
};

export const PublicTimetableOverlay = ({ userId, userName, isMe, onClose }: Props) => {
  const { data: currentSemester } = useSWR('current-semester', () => getCurrentSemester(), semesterCacheOptions);
  const { data: courseYears } = useSWR('course-years', () => getCourseYears(), staticCacheOptions);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedSemester, setSelectedSemester] = useState<string | undefined>();

  const viewYear = selectedYear ?? currentSemester?.year;
  const viewSemester = selectedSemester ?? currentSemester?.semester;

  const yearOptions = useMemo(() => {
    const years = new Set(courseYears ?? []);
    if (currentSemester) years.add(currentSemester.year);
    return Array.from(years).sort((a, b) => b - a);
  }, [courseYears, currentSemester]);

  const { data: entries, error, isLoading } = useSWR(
    viewYear != null && viewSemester ? ['public-timetable', userId, viewYear, viewSemester, isMe] : null,
    () => isMe ? getMyTimetable(viewYear, viewSemester) : getUserTimetable(userId, viewYear, viewSemester),
    stableCacheOptions,
  );

  const entryMap = useMemo(() => {
    const map = new Map<string, TimetableEntry>();
    (entries ?? []).forEach((entry) => {
      map.set(slotKey(entry.course.dayOfWeek, entry.course.period), entry);
    });
    return map;
  }, [entries]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const renderSlotContent = (day: string, period: number) => {
    const entry = entryMap.get(slotKey(day, period));
    if (!entry) return <div className={`${timetableStyles.emptySlot} ${styles.compactSlot}`} />;

    const swatch = getTimetableColorSwatch(entry.color);
    return (
      <div
        className={`${timetableStyles.courseChip} ${styles.compactCourseChip}`}
        style={{ '--chip-bg': swatch.bg } as CSSProperties}
      >
        {entry.course.semester === '通年' && <span className={timetableStyles.fullYearBadge}>通年</span>}
        <span className={`${timetableStyles.courseName} ${styles.compactCourseName}`}>{entry.course.courseName}</span>
        <span className={`${timetableStyles.teacherName} ${styles.compactTeacherName}`}>{entry.course.teacherName}</span>
      </div>
    );
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${userName}の時間割`} onClick={onClose}>
      <div className={styles.sheet} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.floatingCloseButton} onClick={onClose} aria-label="閉じる">
          ×
        </button>
        <main className={`${timetableStyles.main} ${styles.panel}`}>
          <div className={styles.header}>
            <div className={styles.titleBlock}>
              <h1 className={timetableStyles.title}>{userName}の時間割</h1>
            </div>
            <div className={timetableStyles.topControls}>
              <div className={timetableStyles.semesterSelector}>
                <select
                  className={timetableStyles.yearSelect}
                  value={viewYear ?? ''}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
                >
                  {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <div className={timetableStyles.semesterSlider} data-semester={viewSemester === '後期' ? 'late' : 'early'}>
                  {(['前期', '後期'] as const).map((semester) => (
                    <button
                      key={semester}
                      type="button"
                      className={`${timetableStyles.semesterOption} ${viewSemester === semester ? timetableStyles.semesterOptionActive : ''}`}
                      onClick={() => setSelectedSemester(semester)}
                    >
                      {semester}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && <p className={timetableStyles.errorText}>時間割の読み込みに失敗しました。</p>}
          {isLoading ? (
            <p className={timetableStyles.empty}>読み込み中...</p>
          ) : (
            <TimetableGrid
              renderSlotContent={renderSlotContent}
              classNames={{
                mobileTimetable: styles.compactMobileTimetable,
                mobileDayList: styles.compactMobileDayList,
                mobilePeriodRow: styles.compactMobilePeriodRow,
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};
