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
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = useCallback((p: number, size = pageSize) => {
    setError('');
    getUsers(size, p * size)
      .then((data) => {
        setUsers(data.users.items);
        setTotal(data.users.total);
        setPage(p);
      })
      .catch(() => setError('ユーザー一覧の取得に失敗しました'));
  }, [pageSize]);

  const loadSearchPage = useCallback((p: number) => {
    setError('');
    searchUsers(query)
      .then((data) => {
        const allItems = data.adminSearchUsers.items;
        setTotal(allItems.length);
        setUsers(allItems.slice(p * pageSize, (p + 1) * pageSize));
        setPage(p);
      })
      .catch(() => setError('検索に失敗しました'));
  }, [query, pageSize]);

  useEffect(() => {
    if (!isSearching) {
      void Promise.resolve().then(() => loadPage(0));
    } else {
      loadSearchPage(0);
    }
  }, [isSearching, loadPage, loadSearchPage]);

  const handleSearch = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    if (!query.trim()) {
      setIsSearching(false);
      loadPage(0);
      return;
    }
    try {
      const data = await searchUsers(query);
      const allItems = data.adminSearchUsers.items;
      setTotal(allItems.length);
      setUsers(allItems.slice(0, pageSize));
      setPage(0);
      setIsSearching(true);
    } catch {
      setError('検索に失敗しました');
    }
  };

  const handleClear = () => {
    setQuery('');
    setError('');
    setIsSearching(false);
    loadPage(0);
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
            onPrev={() => (isSearching ? loadSearchPage(page - 1) : loadPage(page - 1))}
            onNext={() => (isSearching ? loadSearchPage(page + 1) : loadPage(page + 1))}
          />
        )}
      </main>
    </div>
  );
};
