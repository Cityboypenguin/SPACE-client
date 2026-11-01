import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { useToast } from '../../../context/useToast';
import {
  getCurrentSemester,
  updateCurrentSemester,
  getCourseImportStatus,
  triggerCourseImport,
  createCourse,
  type CourseImportStatus,
} from '../api/courses';
import { subscribeToAdminGraphQL } from '../api/adminGraphqlWs';
import { TIMETABLE_DAYS, TIMETABLE_PERIODS } from '../../user/components/timetableConstants';
import styles from '../styles/AdminShared.module.css';

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
      dryRun
      syncRunID
    }
  }
`;

export const AdminCourseManagementPage = () => {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [year, setYear] = useState(new Date().getFullYear());
  const [semester, setSemester] = useState('前期');
  const [savingSemester, setSavingSemester] = useState(false);

  const [importYear, setImportYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<CourseImportStatus | null>(null);
  const [triggering, setTriggering] = useState(false);
  // 既定はドライラン。授業を書き換える本実行は、結果を確かめてから明示的に選んでもらう。
  const [importDryRun, setImportDryRun] = useState(true);

  const [newDayOfWeek, setNewDayOfWeek] = useState(TIMETABLE_DAYS[0]);
  const [newPeriod, setNewPeriod] = useState(TIMETABLE_PERIODS[0]);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newSemester, setNewSemester] = useState('前期');
  const [creatingCourse, setCreatingCourse] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [currentSemester, importStatus] = await Promise.all([
          getCurrentSemester(),
          getCourseImportStatus(),
        ]);
        setYear(currentSemester.year);
        setSemester(currentSemester.semester);
        setImportYear(currentSemester.year);
        setStatus(importStatus);
      } catch {
        setLoadError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (status?.state !== 'RUNNING') return;
    const unsubscribe = subscribeToAdminGraphQL<{ adminCourseImportStatusUpdated: CourseImportStatus }>(
      ADMIN_COURSE_IMPORT_STATUS_UPDATED_SUBSCRIPTION,
      {},
      (data) => {
        const next = data.adminCourseImportStatusUpdated;
        setStatus(next);
        if (next.state === 'SUCCEEDED') {
          addToast(next.dryRun ? 'ドライランが完了しました。結果を確認してください' : '同期が完了しました', 'success');
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
      if (!importDryRun && !window.confirm(
        `${importYear}年度の授業をシラバスの内容に合わせて書き換えます。\n`
        + 'コマ・授業名・教員名の変更が反映され、シラバスから消えた授業は廃止扱いになります（削除はされません）。\n'
        + '先にドライランで変更内容を確認しましたか？',
      )) return;
      const next = await triggerCourseImport(importYear, importDryRun);
      setStatus(next);
      addToast(importDryRun ? 'ドライランを開始しました' : '同期を開始しました', 'success');
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
    } catch (err) {
      addToast(err instanceof Error ? err.message : '授業の追加に失敗しました', 'error');
    } finally {
      setCreatingCourse(false);
    }
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>授業管理</h1>
        </div>
        {loading ? (
          <p className={styles.loadingText}>読み込み中...</p>
        ) : (
          <div className={styles.cardStack}>
              {loadError && <p className={styles.errorText}>{loadError}</p>}

              {/* 1. 学期指定カード */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>学期指定</h2>
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className={styles.inputCompact}
                    />
                    <span className={styles.unitText}>年</span>
                    <select value={semester} onChange={(e) => setSemester(e.target.value)} className={styles.select}>
                      <option value="前期">前期</option>
                      <option value="後期">後期</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formAction}>
                  <button
                    onClick={() => { void handleSaveSemester(); }}
                    disabled={savingSemester}
                    className={`${styles.primaryButton} ${savingSemester ? styles.disabled : ''}`}
                  >
                    {savingSemester ? '更新中...' : '学期を更新する'}
                  </button>
                </div>
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
                <span>年度をシラバスサイトと同期する</span>
                <label className={styles.inlineRow}>
                  <input
                    type="checkbox"
                    checked={importDryRun}
                    onChange={(e) => setImportDryRun(e.target.checked)}
                    disabled={status?.state === 'RUNNING'}
                  />
                  ドライラン（授業は書き換えず、変更内容だけを確認する）
                </label>
              </div>
              <button
                onClick={() => { void handleTriggerImport(); }}
                disabled={triggering || status?.state === 'RUNNING'}
                className={`${styles.primaryButton} ${styles.primaryButtonLarge} ${(triggering || status?.state === 'RUNNING') ? styles.disabled : ''}`}
              >
                {status?.state === 'RUNNING' ? '実行中...' : importDryRun ? 'ドライランを開始' : '同期を開始'}
              </button>

              {status && (
                <div className={styles.statusLine}>
                  <p>
                    状態：
                    <strong className={styles.importState} data-state={status.state}> {STATE_LABELS[status.state]}</strong>
                    {status.year != null && ` （${status.year}年度${status.dryRun ? '・ドライラン' : ''}）`}
                  </p>
                  {status.state === 'RUNNING' && status.progressPercent != null && (
                    <p className={styles.cellText}>
                      進捗: {status.progressPercent}%（{status.processedCount ?? 0} / {status.totalCount ?? 0}件）
                    </p>
                  )}
                  {status.state === 'SUCCEEDED' && status.syncRunID && (
                    <p className={styles.cellText}>
                      <Link to={`/admin/course-sync?run=${encodeURIComponent(status.syncRunID)}`}>
                        {status.dryRun ? '変更予定の内容を見る' : '変更の内容を見る'}
                      </Link>
                    </p>
                  )}
                  {status.state === 'FAILED' && status.errorMessage && (
                    <p className={styles.errorText}>{status.errorMessage}</p>
                  )}
                </div>
              )}
              <p className={styles.helpText}>
                授業は講義コードで照合し、コマ・授業名・教員名の変更を反映します。シラバスから消えた授業は削除せず
                「廃止」扱いにします（時間割の登録とチャットは残ります）。自動で判断できない変化は確認待ちになります。
                1回の実行に数十秒〜数分かかることがあります。
              </p>
              <p className={styles.cellText}>
                <Link to="/admin/course-sync">同期の履歴・確認待ちを見る</Link>
              </p>
            </div>


              {/* 3. 授業を手動で追加カード */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>授業を手動で追加</h2>
                <form onSubmit={(e) => { void handleCreateCourse(e); }} className={styles.formGrid}>
                  <div className={styles.formRowInline}>
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
                  </div>
                  <div className={styles.formRowInline}>
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
                  </div>
                </form>
                <p className={styles.helpText}>
                  スクレイピングが拾わなかった授業の緊急追加用です。追加すると専用のチャットルームも作られます。
                  後日スクレイピングで同じ授業が取り込まれると重複登録される点に注意してください。
                </p>
              </div>
          </div>
        )}
      </main>
    </div>
  );
};
