import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, type User } from '../api/users';
import { AdminHeader } from '../components/AdminHeader';

export const AdminUserListPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getUsers()
      .then((data) => setUsers(data.users))
      .catch(() => setError('ユーザー一覧の取得に失敗しました'));
  }, []);

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <h1>ユーザー一覧</h1>
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
      </main>
    </div>
  );
};
