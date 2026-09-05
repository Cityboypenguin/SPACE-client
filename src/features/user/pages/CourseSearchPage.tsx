import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { searchCourses, type Course, type SearchCoursesResult } from '../api/course';
import { TIMETABLE_DAYS, TIMETABLE_PERIODS } from '../components/timetableConstants';
import styles from '../components/CourseSearch.module.css';

export const CourseSearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { dayOfWeek?: string; period?: number } | null;

  const [dayOfWeek, setDayOfWeek] = useState(locationState?.dayOfWeek ?? TIMETABLE_DAYS[0]);
  const [period, setPeriod] = useState(locationState?.period ?? TIMETABLE_PERIODS[0]);
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState<SearchCoursesResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const runSearch = async () => {
    setSearching(true);
    setError('');
    try {
      const data = await searchCourses(dayOfWeek, period, keyword.trim() || undefined);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '授業の検索に失敗しました。');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    void runSearch();
  };

  // コマをクリックして遷移してきた場合（曜日・時限が指定済み）は、最初からその
  // コマの授業を表示する。ページを開いた直後にもう一度「検索」を押させない。
  useEffect(() => {
    if (!locationState?.dayOfWeek || !locationState?.period) return;
    (async () => {
      setSearching(true);
      setError('');
      try {
        const data = await searchCourses(locationState.dayOfWeek!, locationState.period!, undefined);
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '授業の検索に失敗しました。');
      } finally {
        setSearching(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ここでは registerTimetableEntry は呼ばない。選んだ授業は時間割の編集モードの
  // 下書きに追加されるだけで、実際の登録は編集モードの「完了」時にまとめて行う。
  const handleSelect = (course: Course) => {
    navigate('/timetable', { state: { pickedCourse: course } });
  };

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate('/timetable', { state: { resumeEditMode: true } })}
          >
            <ChevronLeft /> 戻る
          </button>
          <h1 className={styles.title}>授業を選択</h1>
        </div>

        <form className={styles.filters} onSubmit={handleSearchSubmit}>
          <select className={styles.select} value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
            {TIMETABLE_DAYS.map((day) => <option key={day} value={day}>{day}曜</option>)}
          </select>
          <select className={styles.select} value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
            {TIMETABLE_PERIODS.map((p) => <option key={p} value={p}>{p}限</option>)}
          </select>
          <input
            type="text"
            className={styles.keywordInput}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="授業名・教員名で絞り込み"
          />
          <button type="submit" className={styles.searchButton} disabled={searching}>
            {searching ? '検索中...' : '検索'}
          </button>
        </form>

        {error && <p className={styles.errorText}>{error}</p>}

        {result && (
          <>
            <p className={styles.resultCount}>{result.total}件中 {result.items.length}件を表示</p>
            {result.items.length === 0 ? (
              <p className={styles.empty}>該当する授業が見つかりませんでした。</p>
            ) : (
              <ul className={styles.list}>
                {result.items.map((course) => (
                  <li key={course.ID} className={styles.item}>
                    <div className={styles.itemBody}>
                      <div className={styles.itemName}>{course.courseName}</div>
                      <div className={styles.itemMeta}>{course.teacherName} ・ {course.dayOfWeek}曜{course.period}限</div>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        type="button"
                        className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
                        onClick={() => handleSelect(course)}
                      >
                        この授業を選択
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
};
