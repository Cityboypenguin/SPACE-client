import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { CourseChatAdminTabs } from '../components/molecules/CourseChatAdminTabs';
import {
  listCourses,
  listCourseYears,
  deleteCourse,
  type CourseWithRegisteredCount,
} from '../api/courses';
import { useToast } from '../../../context/useToast';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';
import styles from '../styles/AdminShared.module.css';
import syncStyles from '../styles/AdminCourseSync.module.css';
import { TIMETABLE_DAYS } from '../../user/components/timetableConstants';
import { ADMIN_TOKEN_KEY } from '../api/auth';
import { getCourseChatEnabled, toggleCourseChat } from '../api/maintenance';

// ソートキーの型定義
type SortField = 'registeredCount' | 'messageCount' | 'createdAt';
type SortOrder = 'desc' | 'asc';

export const AdminCourseChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [chats, setChats] = useState<CourseWithRegisteredCount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('courseChats');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [years, setYears] = useState<number[]>([]);
  const [filterYear, setFilterYear] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterDayOfWeek, setFilterDayOfWeek] = useState('');
  useEffect(() => {
    listCourseYears().then(setYears).catch(() => setError('年度の取得に失敗しました'));
  }, []);

  // 検索・ソート用ステート
  const [filterKeyword, setFilterKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [sortField, setSortField] = useState<SortField>('registeredCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [courseChatEnabled, setCourseChatEnabled] = useState(true);
  const [courseChatLoading, setCourseChatLoading] = useState(true);
  const [courseChatToggling, setCourseChatToggling] = useState(false);
  const [showCourseChatConfirm, setShowCourseChatConfirm] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = useCallback(
    (
      p: number,
      size = pageSize,
      keyword = appliedKeyword,
      sortBy = sortField,
      order = sortOrder
    ) => {
      setLoading(true);
      setError('');

      listCourses(
        {
          keyword: keyword.trim() || undefined,
          year: filterYear ? Number(filterYear) : undefined,
          semester: filterSemester || undefined,
          dayOfWeek: filterDayOfWeek || undefined,
          sortBy,
          sortOrder: order,
        },
        size,
        p * size
      )
        .then((data) => {
          setChats(data.items);
          setTotal(data.total);
          setPage(p);
        })
        .catch((err) => {
          setError(
            err instanceof Error ? err.message : 'チャット一覧の取得に失敗しました'
          );
        })
        .finally(() => setLoading(false));
    },
    [pageSize, appliedKeyword, sortField, sortOrder, filterYear, filterSemester, filterDayOfWeek]
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0));
  }, [loadPage]);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setCourseChatLoading(false);
      return;
    }
    getCourseChatEnabled(token)
      .then(setCourseChatEnabled)
      .catch(() => setError('授業内チャットの状態取得に失敗しました'))
      .finally(() => setCourseChatLoading(false));
  }, []);

  const handleCourseChatToggle = async () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;
    setShowCourseChatConfirm(false);
    setCourseChatToggling(true);
    setError('');
    try {
      const next = await toggleCourseChat(!courseChatEnabled, token);
      setCourseChatEnabled(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '授業内チャットの切り替えに失敗しました');
    } finally {
      setCourseChatToggling(false);
    }
  };

  // 検索フォーム送信ハンドラー
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedKeyword(filterKeyword);
    loadPage(0, pageSize, filterKeyword, sortField, sortOrder);
  };

  // ソート順変更ハンドラー
  const handleSortChange = (newField: SortField) => {
    // 同じフィールドを押した場合は昇順/降順を切り替え、異なるフィールドなら降順（desc）初期値
    const newOrder = sortField === newField && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortField(newField);
    setSortOrder(newOrder);
    loadPage(0, pageSize, appliedKeyword, newField, newOrder);
  };

  // 削除処理ハンドラー
  const handleDelete = async (
    chat: CourseWithRegisteredCount,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const warning =
      chat.registeredCount > 0
        ? `このチャットは${chat.registeredCount}人が利用しています。削除するとメッセージや質問、投票データが全て失われます。`
        : 'この操作は取り消せません。';

    if (!window.confirm(`「${chat.courseName}」を削除しますか？\n${warning}`)) return;

    setDeletingId(chat.ID);
    try {
      await deleteCourse(chat.ID);
      addToast('チャットを削除しました', 'success');
      loadPage(page);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'チャットの削除に失敗しました',
        'error'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>授業内チャット管理</h1>
        </div>
        <CourseChatAdminTabs />

        <div className={styles.filterForm}>
          <select aria-label="年度" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={styles.select}>
            <option value="">年度（すべて）</option>
            {years.map((year) => <option key={year} value={year}>{year}年度</option>)}
          </select>
          <select aria-label="学期" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className={styles.select}>
            <option value="">学期（すべて）</option>
            {['前期', '後期', '通年'].map((term) => <option key={term} value={term}>{term}</option>)}
          </select>
          <select aria-label="曜日" value={filterDayOfWeek} onChange={(e) => setFilterDayOfWeek(e.target.value)} className={styles.select}>
            <option value="">曜日（すべて）</option>
            {TIMETABLE_DAYS.map((day) => <option key={day} value={day}>{day}曜</option>)}
          </select>
        </div>
        {/* ツールバー & 検索・ソート */}
        <div className={styles.toolbar}>
          <form
            onSubmit={handleSearchSubmit}
            className={styles.filterForm}
            style={{ flexGrow: 1, maxWidth: '500px', display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              placeholder="チャット名や教員名で検索"
              className={styles.formInput}
            />
            <button type="submit" className={styles.primaryButton}>
              検索
            </button>
          </form>

          <div className={styles.toolbarGroup}>
            <span className={courseChatEnabled ? styles.successText : styles.errorText}>
              授業内チャット: {courseChatLoading ? '確認中...' : courseChatEnabled ? '利用可能' : '停止中'}
            </span>
            <button
              type="button"
              onClick={() => setShowCourseChatConfirm(true)}
              disabled={courseChatLoading || courseChatToggling}
              className={courseChatEnabled ? styles.dangerButtonSmall : styles.primaryButton}
            >
              {courseChatToggling ? '更新中...' : courseChatEnabled ? '一括停止' : 'サービス再開'}
            </button>
            {/* ソート用のドロップダウン選択肢 */}
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
                loadPage(0, pageSize, appliedKeyword, field, order);
              }}
              className={styles.formInput}
              style={{ width: 'auto' }}
            >
              <option value="registeredCount-desc">メンバー数（多い順）</option>
              <option value="registeredCount-asc">メンバー数（少ない順）</option>
              <option value="messageCount-desc">メッセージ数（多い順）</option>
              <option value="messageCount-asc">メッセージ数（少ない順）</option>
              <option value="createdAt-desc">作成日時（新しい順）</option>
              <option value="createdAt-asc">作成日時（古い順）</option>
            </select>

            <span className={styles.countText}>全 {total} 件</span>
            <AdminPageSizeSelect value={pageSize} onChange={setPageSize} />
          </div>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}

        {loading ? (
          <p className={styles.emptyState}>読み込み中...</p>
        ) : chats.length === 0 && !error ? (
          <p className={styles.emptyState}>該当するチャットはありません</p>
        ) : (
          <div className={styles.tablePanelPlain}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableCellLarge}>チャット名</th>
                  <th
                    className={styles.tableCellLarge}
                    onClick={() => handleSortChange('registeredCount')}
                    style={{ cursor: 'pointer', width: '130px' }}
                  >
                    メンバー数 {sortField === 'registeredCount' ? (sortOrder === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th
                    className={styles.tableCellLarge}
                    onClick={() => handleSortChange('messageCount')}
                    style={{ cursor: 'pointer', width: '130px' }}
                  >
                    メッセージ数 {sortField === 'messageCount' ? (sortOrder === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th className={styles.tableCellLarge} style={{ width: '100px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((chat) => (
                  <tr
                    key={chat.ID}
                    onClick={() =>
                      navigate(`/admin/courses/${chat.ID}`, {
                        state: { course: chat },
                      })
                    }
                    className={styles.tableRow}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className={styles.tableCellLarge} style={{ fontWeight: 500 }}>
                      {chat.discontinued && <span className={syncStyles.discontinuedBadge}>廃止</span>}
                      {chat.courseName}
                      {chat.teacherName && (
                        <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '8px' }}>
                          ({chat.teacherName})
                        </span>
                      )}
                    </td>
                    <td className={styles.tableCellLarge}>
                      {chat.registeredCount ?? 0} 人
                    </td>
                    <td className={styles.tableCellLarge}>
                      {chat.messageCount ?? 0} 件
                    </td>
                    <td className={styles.tableCellLarge}>
                      <button
                        type="button"
                        disabled={deletingId === chat.ID}
                        onClick={(e) => handleDelete(chat, e)}
                        className={`${styles.dangerButtonSmall} ${
                          deletingId === chat.ID ? styles.disabled : ''
                        }`}
                      >
                        {deletingId === chat.ID ? '削除中...' : '削除'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPrev={() => loadPage(page - 1)}
            onNext={() => loadPage(page + 1)}
          />
        )}
      </main>

      {showCourseChatConfirm && (
        <div
          className={styles.modalOverlay}
          onClick={(event) => { if (event.target === event.currentTarget) setShowCourseChatConfirm(false); }}
        >
          <div className={styles.confirmDialog}>
            <p className={styles.confirmTitle}>
              {courseChatEnabled ? '授業内チャットを停止しますか？' : '授業内チャットを再開しますか？'}
            </p>
            <p className={styles.confirmText}>
              {courseChatEnabled
                ? '停止すると、授業チャット・質問箱・投票が利用できなくなります。時間割は引き続き利用できます。'
                : '授業チャット・質問箱・投票を再び利用できるようにします。'}
            </p>
            <div className={styles.confirmActions}>
              <button type="button" onClick={() => setShowCourseChatConfirm(false)} className={styles.secondaryButtonLarge}>
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => { void handleCourseChatToggle(); }}
                className={`${styles.primaryButtonLargeRounded} ${courseChatEnabled ? styles.dangerFillButton : styles.successButton}`}
              >
                {courseChatEnabled ? '停止する' : '再開する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
