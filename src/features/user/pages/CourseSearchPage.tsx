import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { Pagination } from '../components/molecules/Pagination';
import { searchCourses, type Course, type SearchCoursesResult } from '../api/course';
import { TIMETABLE_DAYS, TIMETABLE_PERIODS } from '../components/timetableConstants';
import styles from '../components/CourseSearch.module.css';

const DEFAULT_PAGE_SIZE = 50;

type SearchQuery = { dayOfWeek: string; period: number; keyword?: string };

export const CourseSearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { dayOfWeek?: string; period?: number } | null;

  const [dayOfWeek, setDayOfWeek] = useState(locationState?.dayOfWeek ?? TIMETABLE_DAYS[0]);
  const [period, setPeriod] = useState(locationState?.period ?? TIMETABLE_PERIODS[0]);
  const [keyword, setKeyword] = useState('');
  // ページ移動では「検索」を押した時点の条件のまま取得し直す(フォームを書き換えただけで
  // ページを移動すると、表示中の結果と条件が食い違うため)。
  // コマをクリックして遷移してきた場合（曜日・時限が指定済み）は、最初からその
  // コマの授業を表示する。ページを開いた直後にもう一度「検索」を押させない。
  const [query, setQuery] = useState<SearchQuery | null>(() => (
    locationState?.dayOfWeek && locationState?.period
      ? { dayOfWeek: locationState.dayOfWeek, period: locationState.period }
      : null
  ));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [result, setResult] = useState<SearchCoursesResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query) return;
    let active = true;
    (async () => {
      setSearching(true);
      setError('');
      try {
        const data = await searchCourses(query.dayOfWeek, query.period, query.keyword, pageSize, page * pageSize);
        if (active) setResult(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : '授業の検索に失敗しました。');
      } finally {
        if (active) setSearching(false);
      }
    })();
    return () => { active = false; };
  }, [query, page, pageSize]);

  const handleSearchSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setQuery({ dayOfWeek, period, keyword: keyword.trim() || undefined });
    setPage(0);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo(0, 0);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  // ここでは registerTimetableEntry は呼ばない。選んだ授業は時間割の編集モードの
  // 下書きに追加されるだけで、実際の登録は編集モードの「完了」時にまとめて行う。
  const handleSelect = (course: Course) => {
    navigate('/timetable', { state: { pickedCourse: course } });
  };

  const totalPages = result ? Math.max(1, Math.ceil(result.total / pageSize)) : 1;
  const rangeStart = page * pageSize + 1;
  const rangeEnd = page * pageSize + (result?.items.length ?? 0);

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
            {result.items.length === 0 ? (
              <>
                <p className={styles.resultCount}>{result.total}件</p>
                <p className={styles.empty}>該当する授業が見つかりませんでした。</p>
              </>
            ) : (
              <>
                <p className={styles.resultCount}>{result.total}件中 {rangeStart}〜{rangeEnd}件を表示</p>
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
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};
