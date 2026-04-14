import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, searchUsers, type User } from '../api/users';
import { AdminHeader } from '../components/AdminHeader';

export const AdminUserListPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getUsers()
      .then((data) => setUsers(data.users))
      .catch(() => setError('ユーザー一覧の取得に失敗しました'));
  }, []);

  const handleSearch = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    if (!query.trim()) {
      getUsers()
        .then((data) => setUsers(data.users))
        .catch(() => setError('ユーザー一覧の取得に失敗しました'));
      return;
    }
    try {
      const data = await searchUsers(query);
      setUsers(data.searchUsers);
    } catch {
      setError('検索に失敗しました');
    }
  };

  const handleClear = () => {
    setQuery('');
    setError('');
    getUsers()
      .then((data) => setUsers(data.users))
      .catch(() => setError('ユーザー一覧の取得に失敗しました'));
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
                <td>{user.userID}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !error && <p>該当するユーザーが見つかりませんでした</p>}
      </main>
    </div>
  );
};
