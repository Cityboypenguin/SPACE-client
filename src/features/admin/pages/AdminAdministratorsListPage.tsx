import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdministrators, searchAdministrators, type Administrator } from '../api/administrators';
import { AdminHeader } from '../components/organisms/AdminHeader';

const PAGE_SIZE = 20;

export const AdminAdministratorListPage = () => {
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const loadPage = (p: number) => {
    setError('');
    getAdministrators(PAGE_SIZE, p * PAGE_SIZE)
      .then((data) => {
        setAdministrators(data.administrators.items);
        setTotal(data.administrators.total);
        setPage(p);
      })
      .catch(() => setError('管理者一覧の取得に失敗しました'));
  };

  useEffect(() => {
    loadPage(0);
  }, []);

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
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>全 {total} 件</p>
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
