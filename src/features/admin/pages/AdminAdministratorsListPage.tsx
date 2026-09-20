import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdministrators, searchAdministrators, type Administrator } from '../api/administrators';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';
import styles from '../styles/AdminShared.module.css';

export const AdminAdministratorListPage = () => {
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('administrators');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = useCallback((p: number, size = pageSize) => {
    setError('');
    getAdministrators(size, p * size)
      .then((data) => {
        setAdministrators(data.administrators.items);
        setTotal(data.administrators.total);
        setPage(p);
      })
      .catch(() => setError('管理者一覧の取得に失敗しました'));
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
      const data = await searchAdministrators(query);
      setAdministrators(data.searchAdministrators as Administrator[]);
      setTotal(data.searchAdministrators.length);
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
        <h1>管理者一覧</h1>
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
          <AdminPageSizeSelect value={pageSize} onChange={setPageSize} />
        </div>
        <table className={styles.compactTable}>
          <thead>
            <tr>
              <th>名前</th>
              <th>メールアドレス</th>
            </tr>
          </thead>
          <tbody>
            {administrators.map((administrator) => (
              <tr
                key={administrator.ID}
                onClick={() => navigate(`/admin/administrators/${administrator.ID}`)}
                className={styles.clickableRow}
              >
                <td>{administrator.name}</td>
                <td>{administrator.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {administrators.length === 0 && !error && <p>該当する管理者が見つかりませんでした</p>}
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
