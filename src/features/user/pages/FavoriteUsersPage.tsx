import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { useAuth } from '../context/AuthContext';
import { getFavoriteUsersByUserID, deleteFavoriteUser, type User } from '../api/favorite_user';
import { storageUrl } from '../../../lib/storage';

export const FavoriteUsersPage = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await getFavoriteUsersByUserID(userId);
        if (active) setUsers(data || []);
      } catch (err) {
        console.error('お気に入りの取得に失敗しました', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUsers();
    return () => { active = false; };
  }, [userId]);

  const handleUnfavorite = async (targetId: string) => {
    if (!window.confirm('お気に入りを解除しますか？')) return;
    try {
      await deleteFavoriteUser(targetId);
      setUsers((prev) => prev.filter((u) => u.ID !== targetId));
    } catch (err) {
      alert('解除に失敗しました');
    }
  };

  return (
    <div>
      <UserHeader />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        <button onClick={() => navigate('/mypage')} style={{ marginBottom: '1rem' }}>← マイページに戻る</button>
        <h1>お気に入り一覧</h1>

        {loading ? (
          <p>読み込み中...</p>
        ) : users.length === 0 ? (
          <p style={{ color: 'gray' }}>お気に入り登録しているユーザーはいません。</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {users.map((user) => (
              <li key={user.ID} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <div onClick={() => navigate(`/users/${user.ID}`)} style={{ cursor: 'pointer', marginRight: '16px' }}>
                  {user.avatarUrl ? (
                    <img src={storageUrl(user.avatarUrl) ?? undefined} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{user.name.charAt(0)}</div>
                  )}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{user.name}</p>
                  <p style={{ margin: 0, fontSize: '0.8em', color: 'gray' }}>@{user.accountID}</p>
                </div>
                <button onClick={() => handleUnfavorite(user.ID)} style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}>
                  解除
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};