import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getAdministratorByID,
  updateAdministrator,
  deleteAdministrator,
  type Administrator,
} from '../api/administrators';
import { AdminHeader } from '../components/organisms/AdminHeader';

export const AdminAdministratorEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [administrator, setAdministrator] = useState<Administrator | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    getAdministratorByID(id)
      .then((data) => {
        const a = data.getAdministratorByID;
        setAdministrator(a);
        setName(a.name);
        setEmail(a.email);
      })
      .catch(() => setError('管理者情報の取得に失敗しました'));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!id || !administrator) return;
    try {
      const updatedName = name !== administrator.name ? name : undefined;
      const updatedEmail = email !== administrator.email ? email : undefined;
      const updatedPassword = password || undefined;

      const data = await updateAdministrator(id, updatedName, updatedEmail, updatedPassword);
      setAdministrator(data.updateAdministrator);
      setPassword('');
      setSuccess('更新しました');
    } catch {
      setError('更新に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('この管理者アカウントを削除しますか？')) return;
    try {
      await deleteAdministrator(id);
      navigate('/admin/administrators');
    } catch {
      setError('削除に失敗しました');
    }
  };

  if (!administrator) return <p>読み込み中...</p>;

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <button onClick={() => navigate('/admin/administrators')}>← 一覧に戻る</button>
        <h1>管理者アカウントの編集</h1>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="変更しない場合は空欄"
            />
          </div>
          <button type="submit">保存</button>
        </form>

        <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
          <button
            onClick={handleDelete}
            style={{ color: 'white', backgroundColor: 'red', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            このアカウントを削除
          </button>
        </div>
      </main>
    </div>
  );
};
