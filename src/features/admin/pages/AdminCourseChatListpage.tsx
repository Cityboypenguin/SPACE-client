import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import {
  listCourses,
  deleteCourse,
  type CourseWithRegisteredCount,
} from '../api/courses';
import { useToast } from '../../../context/useToast';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';
import styles from '../styles/AdminShared.module.css';

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

  // 検索・ソート用ステート
  const [filterKeyword, setFilterKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [sortField, setSortField] = useState<SortField>('registeredCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    [pageSize, appliedKeyword, sortField, sortOrder]
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0));
  }, [loadPage]);

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
          <h1 className={styles.titleLarge}>チャット管理</h1>
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
    </div>
  );
};
