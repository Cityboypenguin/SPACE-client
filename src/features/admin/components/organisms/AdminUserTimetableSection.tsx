import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { getUserTimetable, adminRegisterTimetableEntry, adminRemoveTimetableEntry, type TimetableEntry } from '../../api/timetable';
import { listCourseYears, getCurrentSemester, listCourses, type Course } from '../../api/courses';
import { TIMETABLE_DAYS, TIMETABLE_PERIODS } from '../../../user/components/timetableConstants';
import { getTimetableColorSwatch } from '../../../user/lib/timetableColors';
import styles from './AdminUserTimetableSection.module.css';

const slotKey = (day: string, period: number) => `${day}-${period}`;

type Props = {
  userID: string;
};

export const AdminUserTimetableSection = ({ userID }: Props) => {
  const [year, setYear] = useState<number | null>(null);
  const [semester, setSemester] = useState<string>('前期');
  const [years, setYears] = useState<number[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [courseYears, current] = await Promise.all([listCourseYears(), getCurrentSemester()]);
        setYears(courseYears.length > 0 ? courseYears : [current.year]);
        setYear((prev) => prev ?? current.year);
        setSemester((prev) => prev ?? current.semester);
      } catch {
        setError('学期情報の取得に失敗しました');
      }
    })();
  }, []);

  const loadTimetable = useCallback(async () => {
    if (year == null || !semester) return;
    setLoading(true);
    setError('');
    try {
      const data = await getUserTimetable(userID, year, semester);
      setEntries(data);
    } catch {
      setError('時間割の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [userID, year, semester]);

  useEffect(() => {
    void Promise.resolve().then(loadTimetable);
  }, [loadTimetable]);

  const entryMap = new Map<string, TimetableEntry>();
  entries.forEach((entry) => entryMap.set(slotKey(entry.course.dayOfWeek, entry.course.period), entry));

  const handleRemove = async (entryID: string) => {
    if (!window.confirm('この授業を時間割から削除しますか？')) return;
    try {
      await adminRemoveTimetableEntry(entryID, userID);
      await loadTimetable();
    } catch {
      setError('削除に失敗しました');
    }
  };

  const handleSearch = async () => {
    if (year == null) return;
    setSearching(true);
    setError('');
    try {
      const page = await listCourses({ year, semester, keyword: keyword || undefined }, 30, 0);
      setSearchResults(page.items);
    } catch {
      setError('コース検索に失敗しました');
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (courseID: string) => {
    try {
      await adminRegisterTimetableEntry(userID, courseID);
      await loadTimetable();
    } catch {
      setError('登録に失敗しました');
    }
  };

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>時間割 (管理者操作用)</h2>

      <div className={styles.controls}>
        <select className={styles.select} value={year ?? ''} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className={styles.select} value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="前期">前期</option>
          <option value="後期">後期</option>
        </select>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {loading ? (
        <p className={styles.muted}>読み込み中...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.grid}>
            <thead>
              <tr>
                <th />
                {TIMETABLE_DAYS.map((day) => <th key={day}>{day}</th>)}
              </tr>
            </thead>
            <tbody>
              {TIMETABLE_PERIODS.map((period) => (
                <tr key={period}>
                  <td className={styles.periodCell}>{period}</td>
                  {TIMETABLE_DAYS.map((day) => {
                    const entry = entryMap.get(slotKey(day, period));
                    return (
                      <td key={day} className={styles.cell}>
                        {entry && (
                          <div
                            className={styles.entry}
                            style={{ '--entry-bg': getTimetableColorSwatch(entry.color).bg } as CSSProperties}
                          >
                            <div className={styles.entryInfo}>
                              <span className={styles.courseName}>{entry.course.courseName}</span>
                              <span className={styles.teacherName}>{entry.course.teacherName}</span>
                            </div>
                            <button
                              type="button"
                              className={styles.removeButton}
                              onClick={() => handleRemove(entry.ID)}
                              aria-label="削除"
                              title="削除"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.searchRow}>
        <input
          className={styles.searchInput}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="授業名・教員名で検索して追加"
        />
        <button type="button" className={styles.addButton} onClick={handleSearch} disabled={searching}>
          {searching ? '検索中...' : '検索'}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className={styles.searchResults}>
          {searchResults.map((course) => (
            <div key={course.ID} className={styles.searchResultRow}>
              <span>
                {course.courseName}（{course.teacherName} / {course.dayOfWeek}{course.period}限）
              </span>
              <button type="button" className={styles.addButton} onClick={() => handleAdd(course.ID)}>
                追加
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
