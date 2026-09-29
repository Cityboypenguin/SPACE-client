import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunities, type Community } from '../api/communities';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';
import styles from '../styles/AdminShared.module.css';

export const AdminCommunityListPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('communities');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = useCallback((p: number, size = pageSize) => {
    setError('');
    getCommunities(size, p * size)
      .then((data) => {
        setCommunities(data.communities.items);
        setTotal(data.communities.total);
        setPage(p);
      })
      .catch(() => setError('コミュニティ一覧の取得に失敗しました'));
  }, [pageSize]);

  const executeClientSearch = useCallback((searchQuery: string, pageNum: number) => {
    setError('');
    getCommunities(1000, 0)
      .then((data) => {
        const q = searchQuery.toLowerCase().trim();
        const filtered = data.communities.items.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.description && c.description.toLowerCase().includes(q))
        );

        setTotal(filtered.length);
        setCommunities(filtered.slice(pageNum * pageSize, (pageNum + 1) * pageSize));
        setPage(pageNum);
      })
      .catch(() => setError('検索に失敗しました'));
  }, [pageSize]);

  useEffect(() => {
    if (!isSearching) {
      void Promise.resolve().then(() => loadPage(0));
    } else {
      executeClientSearch(query, 0);
    }
  }, [isSearching, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // 検索実行
  const handleSearch = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!query.trim()) {
      setIsSearching(false);
      loadPage(0);
      return;
    }
    setIsSearching(true);
    executeClientSearch(query, 0);
  };

  const handleClear = () => {
    setQuery('');
    setError('');
    setIsSearching(false);
    loadPage(0);
  };

  const handlePageChange = (newPage: number) => {
    if (isSearching) {
      executeClientSearch(query, newPage);
    } else {
      loadPage(newPage);
    }
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.page}>
        <h1>コミュニティ一覧</h1>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="コミュニティ名・説明で検索"
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
              <th>名前</th>
              <th>説明</th>
              <th>作成日時</th>
            </tr>
          </thead>
          <tbody>
            {communities.map((community) => (
              <tr
                key={community.ID}
                onClick={() =>
                  navigate(`/admin/communities/${community.ID}`, { state: { community } })
                }
                className={styles.clickableRow}
              >
                <td>{community.name}</td>
                <td>{community.description}</td>
                <td>{community.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {communities.length === 0 && !error && <p>コミュニティが見つかりませんでした</p>}
        {totalPages > 1 && (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPrev={() => handlePageChange(page - 1)}
            onNext={() => handlePageChange(page + 1)}
          />
        )}
      </main>
    </div>
  );
};
