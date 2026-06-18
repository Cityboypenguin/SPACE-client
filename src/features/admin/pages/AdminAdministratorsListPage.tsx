import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdministrators, searchAdministrators, type Administrator } from '../api/administrators';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';

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

  const loadPage = (p: number, size = pageSize) => {
    setError('');
    getAdministrators(size, p * size)
      .then((data) => {
        setAdministrators(data.administrators.items);
        setTotal(data.administrators.total);
        setPage(p);
      })
      .catch(() => setError('管理者一覧の取得に失敗しました'));
  };

  useEffect(() => {
    if (!isSearching) loadPage(0);
  }, [pageSize]);

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
      <main style={{ padding: '2rem' }}>
        <h1>管理者一覧</h1>
        <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前で検索"
          />
          <button type="submit">検索</button>
          {query && (
            <button type="button" onClick={handleClear} style={{ marginLeft: '0.5rem' }}>
              クリア
            </button>
          )}
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>全 {total} 件</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
            表示件数
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '0.25rem 0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}件</option>)}
            </select>
          </label>
        </div>
        <table>
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
                style={{ cursor: 'pointer' }}
              >
                <td>{administrator.name}</td>
                <td>{administrator.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {administrators.length === 0 && !error && <p>該当する管理者が見つかりませんでした</p>}
        {!isSearching && totalPages > 1 && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => loadPage(page - 1)} disabled={page === 0}>前へ</button>
            <span>{page + 1} / {totalPages}</span>
            <button onClick={() => loadPage(page + 1)} disabled={page >= totalPages - 1}>次へ</button>
          </div>
        )}
      </main>
    </div>
  );
};
