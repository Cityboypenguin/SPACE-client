import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR, { mutate as mutateGlobal } from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import {
  getMyTimetable,
  getCurrentSemester,
  getCourseYears,
  removeTimetableEntry,
  setTimetableProfileVisibility,
  type TimetableEntry,
} from '../api/course';
import { stableCacheOptions, staticCacheOptions, semesterCacheOptions } from '../cache/swrOptions';
import { AppSwal } from '../../../lib/swal';
import styles from '../components/Timetable.module.css';

const DAYS = ['月', '火', '水', '木', '金', '土'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export const TimetablePage = () => {
  const navigate = useNavigate();

  const { data: currentSemester } = useSWR('current-semester', () => getCurrentSemester(), semesterCacheOptions);
  const { data: courseYears } = useSWR('course-years', () => getCourseYears(), staticCacheOptions);

  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedSemester, setSelectedSemester] = useState<string | undefined>(undefined);

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
      map.set(`${entry.course.dayOfWeek}:${entry.course.period}`, entry);
    });
    return map;
  }, [entries]);

  const handleRemove = async (entry: TimetableEntry) => {
    const result = await AppSwal.fire({
      text: `「${entry.course.courseName}」を時間割から削除しますか？`,
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;
    await removeTimetableEntry(entry.ID);
    void mutate();
  };

  const handleToggleVisibility = async (entry: TimetableEntry) => {
    await setTimetableProfileVisibility(entry.ID, !entry.isProfileVisible);
    void mutate();
  };

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.topActions}>
          <div className={styles.semesterSelector}>
            {/* 学期セレクタを操作するたびに「現在の学期」を明示的に再検証する。管理者が
                別タブ等で学期を切り替えた直後でも、ここでの選択が正しく「編集可能」
                かどうかを古いキャッシュ値で誤判定しないようにするため。 */}
            <select
              className={styles.yearSelect}
              value={viewYear ?? ''}
              onChange={(e) => {
                setSelectedYear(e.target.value ? Number(e.target.value) : undefined);
                void mutateGlobal('current-semester');
              }}
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <span>年</span>
            <select
              className={styles.semesterSelect}
              value={viewSemester ?? ''}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                void mutateGlobal('current-semester');
              }}
            >
              <option value="前期">前期</option>
              <option value="後期">後期</option>
            </select>
            {!isEditable && <span className={styles.readOnlyBadge}>閲覧のみ</span>}
          </div>
          {isEditable && (
            <button className={styles.searchButton} onClick={() => navigate('/timetable/search')}>
              授業を検索
            </button>
          )}
        </div>

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
                      const entry = entryMap.get(`${day}:${period}`);
                      return (
                        <td key={day} className={styles.cell}>
                          {entry ? (
                            <div
                              className={`${styles.courseChip} ${!isEditable ? styles.courseChipReadOnly : ''}`}
                              onClick={() => navigate(`/courses/chat/${entry.course.roomID}`, { state: { course: entry.course } })}
                            >
                              {isEditable && (
                                <div className={styles.chipActions}>
                                  <button
                                    type="button"
                                    className={`${styles.chipActionButton} ${entry.isProfileVisible ? styles.chipActionButtonActive : ''}`}
                                    title={entry.isProfileVisible ? 'プロフィールに公開中（クリックで非公開に）' : 'プロフィールに非公開（クリックで公開に）'}
                                    onClick={(e) => { e.stopPropagation(); handleToggleVisibility(entry); }}
                                  >
                                    ●
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.chipActionButton}
                                    title="時間割から削除"
                                    onClick={(e) => { e.stopPropagation(); handleRemove(entry); }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                              <span className={styles.courseName}>{entry.course.courseName}</span>
                              <span className={styles.teacherName}>{entry.course.teacherName}</span>
                            </div>
                          ) : isEditable ? (
                            <button
                              type="button"
                              className={styles.emptyCellButton}
                              onClick={() => navigate('/timetable/search', { state: { dayOfWeek: day, period } })}
                            >
                              +
                            </button>
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
