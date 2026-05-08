import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserByID, getProfileByUserID, type User, type Profile } from '../api/users';
import { AdminHeader } from '../components/AdminHeader';

export const AdminUserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getUserByID(id)
      .then((data) => {
        setUser(data.getUserByID);
        return getProfileByUserID(id);
      })
      .then((data) => setProfile(data.getProfileByUserID))
      .catch(() => setError('プロフィールの取得に失敗しました'));
  }, [id]);

  if (!user) return <p>読み込み中...</p>;

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <button onClick={() => navigate(`/admin/users/${id}`)}>← 詳細に戻る</button>
        <h1>{user.name} のプロフィール</h1>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {profile === undefined ? (
          <p>読み込み中...</p>
        ) : profile === null ? (
          <p>プロフィールが設定されていません</p>
        ) : (
          <dl style={{ lineHeight: '2' }}>
            <dt><strong>ユーザー名</strong></dt>
            <dd>{profile.username}</dd>
            <dt><strong>自己紹介</strong></dt>
            <dd>{profile.bio ?? '未設定'}</dd>
            <dt><strong>アイコン画像</strong></dt>
            <dd>
              {profile.image ? (
                <img src={profile.image} alt="プロフィール画像" style={{ width: 80, height: 80, objectFit: 'cover' }} />
              ) : (
                '未設定'
              )}
            </dd>
            <dt><strong>プロフィール作成日</strong></dt>
            <dd>{profile.createdAt}</dd>
            <dt><strong>プロフィール更新日</strong></dt>
            <dd>{profile.updatedAt}</dd>
          </dl>
        )}
      </main>
    </div>
  );
};
