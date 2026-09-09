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

  useEffect(() => {
    if (!isSearching) void Promise.resolve().then(() => loadPage(0));
  }, [isSearching, loadPage]);

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
      setUsers(data.searchUsers.items);
      setTotal(data.searchUsers.total);
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
      <main className={styles.page}>
        <h1>ユーザー一覧</h1>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前で検索"
            className={styles.input}
          />
          <button type="submit" className={styles.primaryButton}>検索</button>
          {query && (
            <button type="button" onClick={handleClear} className={styles.paginationButton}>
              クリア
            </button>
          )}
        </form>
        {error && <p className={styles.errorText}>{error}</p>}
        <div className={styles.listMetaRow}>
          <p className={styles.countText}>全 {total} 件</p>
          <AdminPageSizeSelect value={pageSize} onChange={setPageSize} muted />
        </div>
        <table className={styles.compactTable}>
          <thead>
            <tr>
              <th>ユーザーID</th>
              <th>名前</th>
              <th>メールアドレス</th>
              <th>ロール</th>
              <th>ステータス</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.ID}
                onClick={() => navigate(`/admin/users/${user.ID}`)}
                className={styles.clickableRow}
              >
                <td>{user.accountID}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !error && <p>該当するユーザーが見つかりませんでした</p>}
        {!isSearching && totalPages > 1 && (
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
