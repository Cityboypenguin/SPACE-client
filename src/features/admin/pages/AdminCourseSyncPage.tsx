import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { AdminPagination } from '../components/molecules/AdminPagination';
import { useToast } from '../../../context/useToast';
import {
  listCourseSyncRuns,
  listCourseSyncChanges,
  listCourseSyncReviews,
  resolveCourseSyncReview,
  type CourseSnapshot,
  type CourseSyncChange,
  type CourseSyncChangeKind,
  type CourseSyncReview,
  type CourseSyncReviewDecision,
  type CourseSyncRun,
} from '../api/courses';
import styles from '../styles/AdminShared.module.css';
import syncStyles from '../styles/AdminCourseSync.module.css';

const RUN_PAGE_SIZE = 10;
const CHANGE_PAGE_SIZE = 50;
const REVIEW_PAGE_SIZE = 20;

const KIND_LABELS: Record<CourseSyncChangeKind, string> = {
  CREATED: '新規',
  UPDATED: '更新',
  DISCONTINUED: '廃止',
  RESTORED: '廃止取り消し',
  REVIEW: '確認待ち',
};

const KIND_TABS: { kind?: CourseSyncChangeKind; label: string }[] = [
  { label: 'すべて' },
  { kind: 'UPDATED', label: '更新' },
  { kind: 'DISCONTINUED', label: '廃止' },
  { kind: 'CREATED', label: '新規' },
  { kind: 'RESTORED', label: '廃止取り消し' },
  { kind: 'REVIEW', label: '確認待ち' },
];

const REVIEW_KIND_LABELS: Record<CourseSyncReview['kind'], string> = {
  CODE_REUSED: '講義コードの使い回しの疑い',
  CODE_REISSUED: '講義コードの振り直しの疑い',
  SLOT_AMBIGUOUS: 'コマの対応が決まらない',
};

const formatDateTime = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('ja-JP');
};

const slotText = (s: CourseSnapshot) => `${s.semester} ${s.dayOfWeek}${s.period}限`;

const SnapshotList = ({ items }: { items: CourseSnapshot[] }) => (
  <ul className={syncStyles.snapshotList}>
    {items.map((s, i) => (
      <li key={`${s.sourceRef}-${s.dayOfWeek}-${s.period}-${i}`}>
        {s.courseName}（{s.teacherName}）{slotText(s)}・講義コード {s.sourceRef || '—'}
      </li>
    ))}
  </ul>
);

export const AdminCourseSyncPage = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRunID = searchParams.get('run');

  const [runs, setRuns] = useState<CourseSyncRun[]>([]);
  const [runTotal, setRunTotal] = useState(0);
  const [runPage, setRunPage] = useState(0);
  const [runsError, setRunsError] = useState('');

  const [kind, setKind] = useState<CourseSyncChangeKind | undefined>(undefined);
  const [changes, setChanges] = useState<CourseSyncChange[]>([]);
  const [changeTotal, setChangeTotal] = useState(0);
  const [changePage, setChangePage] = useState(0);
  const [changesLoading, setChangesLoading] = useState(false);
  const [changesError, setChangesError] = useState('');

  const [reviews, setReviews] = useState<CourseSyncReview[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewsError, setReviewsError] = useState('');
  const [resolvingID, setResolvingID] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await listCourseSyncRuns(RUN_PAGE_SIZE, runPage * RUN_PAGE_SIZE);
        setRuns(data.items);
        setRunTotal(data.total);
        setRunsError('');
      } catch (err) {
        setRunsError(err instanceof Error ? err.message : '同期の履歴の取得に失敗しました');
      }
    })();
  }, [runPage]);

  // URL に実行の指定が無ければ最新の実行を開く。
  const runID = selectedRunID ?? runs[0]?.ID ?? null;
  const selectedRun = runs.find((r) => r.ID === runID) ?? null;

  useEffect(() => {
    if (!runID) return;
    (async () => {
      setChangesLoading(true);
      try {
        const data = await listCourseSyncChanges(runID, kind, CHANGE_PAGE_SIZE, changePage * CHANGE_PAGE_SIZE);
        setChanges(data.items);
        setChangeTotal(data.total);
        setChangesError('');
      } catch (err) {
        setChangesError(err instanceof Error ? err.message : '変更の取得に失敗しました');
      } finally {
        setChangesLoading(false);
      }
    })();
  }, [runID, kind, changePage]);

  const refetchReviews = useCallback(async () => {
    try {
      const data = await listCourseSyncReviews('PENDING', REVIEW_PAGE_SIZE, reviewPage * REVIEW_PAGE_SIZE);
      setReviews(data.items);
      setReviewTotal(data.total);
      setReviewsError('');
    } catch (err) {
      setReviewsError(err instanceof Error ? err.message : '確認待ちの取得に失敗しました');
    }
  }, [reviewPage]);

  useEffect(() => {
    (async () => {
      await refetchReviews();
    })();
  }, [refetchReviews]);

  const selectRun = (id: string) => {
    setKind(undefined);
    setChangePage(0);
    setSearchParams({ run: id });
  };

  const selectKind = (next: CourseSyncChangeKind | undefined) => {
    setKind(next);
    setChangePage(0);
  };

  const handleResolve = async (review: CourseSyncReview, decision: CourseSyncReviewDecision, label: string) => {
    if (!window.confirm(`「${label}」と判断します。次回の同期でこの判断が反映されます。よろしいですか？`)) return;
    setResolvingID(review.ID);
    try {
      await resolveCourseSyncReview(review.ID, decision);
      addToast('判断を記録しました。次回の同期で反映されます', 'success');
      await refetchReviews();
    } catch (err) {
      addToast(err instanceof Error ? err.message : '判断の記録に失敗しました', 'error');
    } finally {
      setResolvingID(null);
    }
  };

  const decisionsFor = (review: CourseSyncReview): { decision: CourseSyncReviewDecision; label: string; description: string }[] => {
    const keep = { decision: 'IGNORED' as const, label: '据え置く', description: '今のまま何も変えない（同じ状況では再び確認に回さない）' };
    switch (review.kind) {
      case 'CODE_REUSED':
        return [
          { decision: 'SAME', label: '同じ授業として更新', description: '既存の授業の名前・教員を書き換える（ルーム・時間割を引き継ぐ）' },
          { decision: 'DIFFERENT', label: '別の授業として扱う', description: '既存の授業は廃止し、新しい授業を作る' },
          keep,
        ];
      case 'CODE_REISSUED':
        return [
          { decision: 'SAME', label: '同じ授業として引き継ぐ', description: '既存の授業を新しい講義コードに付け替える（ルーム・時間割を引き継ぐ）' },
          { decision: 'DIFFERENT', label: '別の授業として扱う', description: '既存の授業は廃止し、新しい授業を作る' },
          keep,
        ];
      case 'SLOT_AMBIGUOUS':
        return [
          { decision: 'DIFFERENT', label: '新しいコマで作り直す', description: '対応の付かない旧コマは廃止し、新しいコマを作る' },
          keep,
        ];
    }
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.page}>
        <p className={styles.cellText}><Link to="/admin/courses">← 授業管理へ戻る</Link></p>
        <h1>シラバス同期の結果</h1>

        <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}>
          <h2 className={styles.sectionTitle}>確認待ち（{reviewTotal}件）</h2>
          <p className={styles.helpText}>
            自動では判断しなかった変化です。判断するまで、該当する授業には何も変更を加えません。判断は次回の同期で反映されます。
          </p>
          {reviewsError && <p className={styles.errorText}>{reviewsError}</p>}
          {reviews.length === 0 ? (
            <p className={styles.mutedText}>確認待ちはありません。</p>
          ) : (
            reviews.map((review) => (
              <div key={review.ID} className={syncStyles.reviewCard}>
                <p className={syncStyles.reviewMessage}>
                  <span className={syncStyles.kindBadge} data-kind="REVIEW">{REVIEW_KIND_LABELS[review.kind]}</span>{' '}
                  {review.year}年度・{review.message}
                </p>
                <div className={syncStyles.compare}>
                  <div>
                    <p className={syncStyles.compareTitle}>今の授業</p>
                    <SnapshotList items={review.existing} />
                  </div>
                  <div>
                    <p className={syncStyles.compareTitle}>シラバスの内容</p>
                    <SnapshotList items={review.proposed} />
                  </div>
                </div>
                <div className={syncStyles.decisionRow}>
                  {decisionsFor(review).map((d) => (
                    <button
                      key={d.decision}
                      type="button"
                      title={d.description}
                      disabled={resolvingID === review.ID}
                      onClick={() => { void handleResolve(review, d.decision, d.label); }}
                      className={d.decision === 'IGNORED' ? styles.secondaryButtonSmall : styles.outlinePrimaryButton}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
          <AdminPagination
            page={reviewPage}
            totalPages={Math.ceil(reviewTotal / REVIEW_PAGE_SIZE)}
            onPrev={() => setReviewPage((p) => Math.max(0, p - 1))}
            onNext={() => setReviewPage((p) => p + 1)}
          />
        </div>

        <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}>
          <h2 className={styles.sectionTitle}>実行履歴</h2>
          {runsError && <p className={styles.errorText}>{runsError}</p>}
          {runs.length === 0 ? (
            <p className={styles.mutedText}>まだ同期を実行していません。</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.compactTable}>
                <thead>
                  <tr className={styles.compactHeaderRow}>
                    <th className={styles.compactTableHeader}>実行日時</th>
                    <th className={styles.compactTableHeader}>年度</th>
                    <th className={styles.compactTableHeader}>種別</th>
                    <th className={styles.compactTableHeader}>新規</th>
                    <th className={styles.compactTableHeader}>更新</th>
                    <th className={styles.compactTableHeader}>廃止</th>
                    <th className={styles.compactTableHeader}>確認待ち</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr
                      key={run.ID}
                      onClick={() => selectRun(run.ID)}
                      className={`${styles.clickableRow} ${run.ID === runID ? syncStyles.runRowSelected : ''}`}
                    >
                      <td className={styles.compactTableCell}>{formatDateTime(run.finishedAt)}</td>
                      <td className={styles.compactTableCell}>{run.year}</td>
                      <td className={styles.compactTableCell}>{run.dryRun ? 'ドライラン' : '本実行'}</td>
                      <td className={styles.compactTableCell}>{run.createdCount}</td>
                      <td className={styles.compactTableCell}>{run.updatedCount + run.restoredCount}</td>
                      <td className={styles.compactTableCell}>{run.discontinuedCount}</td>
                      <td className={styles.compactTableCell}>{run.reviewCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AdminPagination
            page={runPage}
            totalPages={Math.ceil(runTotal / RUN_PAGE_SIZE)}
            onPrev={() => setRunPage((p) => Math.max(0, p - 1))}
            onNext={() => setRunPage((p) => p + 1)}
          />
        </div>

        {runID && (
          <div className={`${styles.sectionCard} ${styles.sectionCardWide}`}>
            <h2 className={styles.sectionTitle}>
              {selectedRun
                ? `${selectedRun.year}年度 ${selectedRun.dryRun ? 'ドライラン（変更予定）' : '同期'}・${formatDateTime(selectedRun.finishedAt)}`
                : '変更の内容'}
            </h2>

            {selectedRun && (
              <>
                {selectedRun.dryRun && (
                  <p className={syncStyles.notice}>
                    ドライランの結果です。授業はまだ書き換えていません。内容に問題がなければ、授業管理画面から本実行してください。
                  </p>
                )}
                {selectedRun.unregisteredCount > 0 && (
                  <p className={styles.helpText}>
                    時間割は1コマ1授業です。授業のコマが変わり、移った先のコマに別の授業を登録していた人は、
                    移ってきた授業を時間割から{selectedRun.dryRun ? '外します' : '外しました'}（元からそのコマにあった授業を残します）。
                    {selectedRun.dryRun ? '本実行すると、' : ''}外れた人にはアプリ内通知で知らせ{selectedRun.dryRun ? 'ます' : 'ました'}。
                  </p>
                )}
                {selectedRun.discontinueSkippedReason && (
                  <p className={syncStyles.notice}>{selectedRun.discontinueSkippedReason}</p>
                )}
                <div className={syncStyles.countGrid}>
                  {[
                    ['新規', selectedRun.createdCount],
                    ['更新', selectedRun.updatedCount],
                    ['廃止', selectedRun.discontinuedCount],
                    ['廃止取り消し', selectedRun.restoredCount],
                    ['確認待ち', selectedRun.reviewCount],
                    ['変更なし', selectedRun.unchangedCount],
                    [selectedRun.dryRun ? '時間割から外す登録' : '時間割から外した登録', selectedRun.unregisteredCount],
                  ].map(([label, value]) => (
                    <div key={label} className={syncStyles.countCell}>
                      <span className={syncStyles.countValue}>{value}</span>
                      <span className={syncStyles.countLabel}>{label}</span>
                    </div>
                  ))}
                </div>
                <p className={styles.metaText}>
                  シラバスの授業 {selectedRun.siteTotal}件中 {selectedRun.listedRows}件を読み取り
                  {selectedRun.unidentifiedRows > 0 && `（講義コードを読めなかった授業 ${selectedRun.unidentifiedRows}件）`}
                </p>
              </>
            )}

            <div className={styles.tabBar}>
              {KIND_TABS.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => selectKind(tab.kind)}
                  className={`${styles.tabButton} ${kind === tab.kind ? styles.tabButtonActive : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {changesError && <p className={styles.errorText}>{changesError}</p>}
            {changesLoading ? (
              <p>読み込み中...</p>
            ) : changes.length === 0 ? (
              <p className={styles.mutedText}>該当する変更はありません。</p>
            ) : (
              <>
                <p className={styles.metaText}>登録者の多い（影響の大きい）順に表示しています。全{changeTotal}件</p>
                <div className={styles.tableWrap}>
                  <table className={styles.compactTable}>
                    <thead>
                      <tr className={styles.compactHeaderRow}>
                        <th className={styles.compactTableHeader}>種別</th>
                        <th className={styles.compactTableHeader}>授業</th>
                        <th className={styles.compactTableHeader}>内容</th>
                        <th className={styles.compactTableHeader}>登録者</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changes.map((change) => (
                        <tr key={change.ID}>
                          <td className={styles.compactTableCell}>
                            <span className={syncStyles.kindBadge} data-kind={change.kind}>{KIND_LABELS[change.kind]}</span>
                          </td>
                          <td className={`${styles.compactTableCell} ${syncStyles.courseCell}`}>
                            {change.courseID ? (
                              <Link to={`/admin/courses/${change.courseID}`}>{change.courseName}</Link>
                            ) : change.courseName}
                            <br />
                            <span className={styles.mutedText}>{change.teacherName}</span>
                          </td>
                          <td className={styles.compactTableCell}>{change.detail}</td>
                          <td className={`${styles.compactTableCell} ${syncStyles.registrantCell}`}>
                            {change.registeredCount}人
                            {change.unregisteredCount > 0 && (
                              <>
                                <br />
                                <span className={syncStyles.unregisteredText}>
                                  うち{change.unregisteredCount}人の時間割から{selectedRun?.dryRun ? '外す' : '外した'}
                                </span>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <AdminPagination
                  page={changePage}
                  totalPages={Math.ceil(changeTotal / CHANGE_PAGE_SIZE)}
                  onPrev={() => setChangePage((p) => Math.max(0, p - 1))}
                  onNext={() => setChangePage((p) => p + 1)}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
