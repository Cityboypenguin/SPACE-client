import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserByID, updateUser, deleteUser, type User } from '../api/users';
import { AdminHeader } from '../components/AdminHeader';

export const AdminUserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [userID, setUserID] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!id) return;
    getUserByID(id)
      .then((data) => {
        const u = data.getUserByID;
        setUser(u);
        setUserID(u.userID);
        setName(u.name);
        setEmail(u.email);
      })
      .catch(() => setError('ユーザー情報の取得に失敗しました'));
  }, [id]);

  const handleUpdate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!id) return;
    setError('');
    setSuccess('');
    try {
      const input: Parameters<typeof updateUser>[0] = { ID: id, userID, name, email };
      if (password) input.password = password;
      const data = await updateUser(input);
      setUser(data.updateUser);
      setPassword('');
      setSuccess('更新しました');
    } catch {
      setError('更新に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!id || !user) return;
    if (!window.confirm(`${user.name} を削除しますか？`)) return;
    try {
      await deleteUser(id);
      navigate('/admin/users');
    } catch {
      setError('削除に失敗しました');
    }
  };

  if (!user) return <p>読み込み中...</p>;

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <button onClick={() => navigate('/admin/users')}>← 一覧に戻る</button>
        <h1>ユーザー詳細</h1>
        <p>登録日時: {user.createdAt}</p>
        <p>更新日時: {user.updatedAt}</p>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <form onSubmit={handleUpdate}>
          <h2>情報編集</h2>
          <label>
            ユーザーID
            <input
              type="text"
              value={userID}
              onChange={(e) => setUserID(e.target.value)}
              required
            />
          </label>
          <label>
            名前
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            パスワード（変更する場合のみ入力）
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit">更新する</button>
        </form>

        <hr />
        <button onClick={handleDelete} style={{ color: 'red' }}>
          このユーザーを削除する
        </button>
      </main>
    </div>
  );
};
