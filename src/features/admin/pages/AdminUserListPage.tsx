import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, searchUsers, type User } from '../api/users';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';

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

  const loadPage = (p: number, size = pageSize) => {
    setError('');
    getUsers(size, p * size)
      .then((data) => {
        setUsers(data.users.items);
        setTotal(data.users.total);
        setPage(p);
      })
      .catch(() => setError('ユーザー一覧の取得に失敗しました'));
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
      const data = await searchUsers(query);
      setUsers(data.searchUsers);
      setTotal(data.searchUsers.length);
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
        <h1>ユーザー一覧</h1>
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
                style={{ cursor: 'pointer' }}
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
