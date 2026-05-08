import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserByID, adminUpdateUser, type User } from '../api/users';
import { AdminHeader } from '../components/organisms/AdminHeader';

export const AdminUserEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [accountID, setAccountID] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    getUserByID(id)
      .then((data) => {
        const u = data.getUserByID;
        setUser(u);
        setAccountID(u.accountID);
        setName(u.name);
        setEmail(u.email);
      })
      .catch(() => setError('ユーザー情報の取得に失敗しました'));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!id || !user) return;
    try {
      const input: { accountID?: string; name?: string; email?: string; password?: string } = {};
      if (accountID !== user.accountID) input.accountID = accountID;
      if (name !== user.name) input.name = name;
      if (email !== user.email) input.email = email;
      if (password) input.password = password;

      const data = await adminUpdateUser(id, input);
      setUser(data.adminUpdateUser);
      setPassword('');
      setSuccess('更新しました');
    } catch {
      setError('更新に失敗しました');
    }
  };

  if (!user) return <p>読み込み中...</p>;

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <button onClick={() => navigate(`/admin/users/${id}`)}>← 詳細に戻る</button>
        <h1>ユーザー情報の編集</h1>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <div>
            <label>ユーザーID</label><br />
            <input value={accountID} onChange={(e) => setAccountID(e.target.value)} />
          </div>
          <div>
            <label>名前</label><br />
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label>メールアドレス</label><br />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label>新しいパスワード（変更する場合のみ）</label><br />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="変更しない場合は空欄" />
          </div>
          <button type="submit">保存</button>
        </form>
      </main>
    </div>
  );
};
