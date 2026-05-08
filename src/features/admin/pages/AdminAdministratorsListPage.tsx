import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdministrators, searchAdministrators, type Administrator } from '../api/administrators';
import { AdminHeader } from '../components/organisms/AdminHeader';

export const AdminAdministratorListPage = () => {
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getAdministrators()
      .then((data) => setAdministrators(data.administrators))
      .catch(() => setError('管理者一覧の取得に失敗しました'));
  }, []);

  const handleSearch = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    if (!query.trim()) {
      getAdministrators()
        .then((data) => setAdministrators(data.administrators))
        .catch(() => setError('管理者一覧の取得に失敗しました'));
      return;
    }
    try {
      const data = await searchAdministrators(query);
      setAdministrators(data.searchAdministrators as Administrator[]);
    } catch {
      setError('検索に失敗しました');
    }
  };

  const handleClear = () => {
    setQuery('');
    setError('');
    getAdministrators()
      .then((data) => setAdministrators(data.administrators))
      .catch(() => setError('管理者一覧の取得に失敗しました'));
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
      </main>
    </div>
  );
};
