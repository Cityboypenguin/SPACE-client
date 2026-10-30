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
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>管理者一覧</h1>
        </div>

        <div className={styles.toolbar}>
          <form onSubmit={handleSearch} className={styles.toolbarGroup}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="名前で検索"
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
                <th className={styles.tableCellLarge}>名前</th>
                <th className={styles.tableCellLarge}>メールアドレス</th>
              </tr>
            </thead>
            <tbody>
              {administrators.map((administrator) => (
                <tr
                  key={administrator.ID}
                  onClick={() => navigate(`/admin/administrators/${administrator.ID}`)}
                  className={styles.tableRow}
                  style={{ cursor: 'pointer' }}
                >
                  <td className={styles.tableCellLarge} style={{ fontWeight: 600 }}>{administrator.name}</td>
                  <td className={styles.tableCellLarge}>{administrator.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {administrators.length === 0 && !error && (
          <p className={styles.emptyState}>該当する管理者が見つかりませんでした</p>
        )}

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
