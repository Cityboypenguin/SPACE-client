import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserByID, deleteUser, type User } from '../api/users';
import { AdminHeader } from '../components/AdminHeader';

export const AdminUserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getUserByID(id)
      .then((data) => setUser(data.getUserByID))
      .catch(() => setError('ユーザー情報の取得に失敗しました'));
  }, [id]);

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

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <dl>
          <dt>ユーザーID</dt>
          <dd>{user.userID}</dd>
          <dt>名前</dt>
          <dd>{user.name}</dd>
          <dt>メールアドレス</dt>
          <dd>{user.email}</dd>
          <dt>ロール</dt>
          <dd>{user.role}</dd>
          <dt>ステータス</dt>
          <dd>{user.status}</dd>
          <dt>登録日時</dt>
          <dd>{user.createdAt}</dd>
          <dt>更新日時</dt>
          <dd>{user.updatedAt}</dd>
        </dl>

        <hr />
        <button onClick={handleDelete} style={{ color: 'red' }}>
          このユーザーを削除する
        </button>
      </main>
    </div>
  );
};
