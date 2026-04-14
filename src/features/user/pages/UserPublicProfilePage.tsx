import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserByID, type UserProfile } from '../api/profile';
import { UserHeader } from '../components/UserHeader';

export const UserPublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getUserByID(id)
      .then((data) => setUser(data.getUserByID))
      .catch(() => setError('ユーザー情報の取得に失敗しました'));
  }, [id]);

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem' }}>
        <button onClick={() => navigate('/search')}>← 検索に戻る</button>
        <h1>ユーザー詳細</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!user && !error && <p>読み込み中...</p>}
        {user && (
          <dl>
            <dt>ユーザーID</dt>
            <dd>{user.userID}</dd>
            <dt>名前</dt>
            <dd>{user.name}</dd>
            <dt>ロール</dt>
            <dd>{user.role}</dd>
            <dt>ステータス</dt>
            <dd>{user.status}</dd>
          </dl>
        )}
      </main>
    </div>
  );
};
