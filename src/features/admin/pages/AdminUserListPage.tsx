import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, searchUsers, type User } from '../api/users';
import { AdminHeader } from '../components/organisms/AdminHeader';

const PAGE_SIZE = 20;

export const AdminUserListPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const loadPage = (p: number) => {
    setError('');
    getUsers(PAGE_SIZE, p * PAGE_SIZE)
      .then((data) => {
        setUsers(data.users.items);
        setTotal(data.users.total);
        setPage(p);
      })
      .catch(() => setError('ユーザー一覧の取得に失敗しました'));
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
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>全 {total} 件</p>
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
