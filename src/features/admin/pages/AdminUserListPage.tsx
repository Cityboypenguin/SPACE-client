import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, searchUsers, type User } from '../api/users';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';
import styles from '../styles/AdminShared.module.css';

export const AdminUserListPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('users');
  const [query, setQuery] = useState('');
  // 検索ボタンで確定したキーワード。入力中の query で毎回検索し直さないよう分けて持つ。
  const [searchKeyword, setSearchKeyword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / pageSize);

  // 一覧も検索結果も、サーバーから1ページ分だけを取る。
  const loadPage = useCallback((p: number) => {
    setError('');
    const request = searchKeyword
      ? searchUsers(searchKeyword, pageSize, p * pageSize).then((data) => data.adminSearchUsers)
      : getUsers(pageSize, p * pageSize).then((data) => data.users);
    request
      .then((data) => {
        setUsers(data.items);
        setTotal(data.total);
        setPage(p);
      })
      .catch(() => setError(searchKeyword ? '検索に失敗しました' : 'ユーザー一覧の取得に失敗しました'));
  }, [searchKeyword, pageSize]);

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0));
  }, [loadPage]);

  const handleSearch = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSearchKeyword(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    setSearchKeyword('');
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>ユーザー管理</h1>
        </div>

        <div className={styles.toolbar}>
          <form onSubmit={handleSearch} className={styles.toolbarGroup}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ID・名前・メールアドレスで検索"
              className={styles.select}
              style={{ width: '280px' }}
            />
            <button type="submit" className={styles.primaryButton}>検索</button>
            {query && (
              <button type="button" onClick={handleClear} className={styles.paginationButton}>
                クリア
              </button>
            )}
          </form>

          <div className={styles.toolbarGroup}>
            <p className={styles.cellMuted} style={{ margin: 0 }}>全 {total} 件</p>
            <AdminPageSizeSelect value={pageSize} onChange={setPageSize} muted />
          </div>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}

        <div className={styles.tablePanelPlain}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableCellLarge}>ユーザーID</th>
                <th className={styles.tableCellLarge}>名前</th>
                <th className={styles.tableCellLarge}>メールアドレス</th>
                <th className={styles.tableCellLarge}>登録日時</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.ID}
                  onClick={() => navigate(`/admin/users/${user.ID}`)}
                  className={styles.tableRow}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>@{user.accountID || user.ID}</td>
                  <td className={styles.tableCellLarge} style={{ fontWeight: 600 }}>{user.name}</td>
                  <td className={styles.tableCellLarge}>{user.email || '-'}</td>
                  <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>
                    {new Date(user.createdAt).toLocaleString('ja-JP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !error && (
          <p className={styles.emptyState}>該当するユーザーが見つかりませんでした</p>
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
