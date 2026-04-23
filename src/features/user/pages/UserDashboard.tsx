import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { getMyProfile, type UserProfile } from '../api/profile';
import { USER_ID_KEY } from '../api/auth';

export const UserDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setProfile(data.me);
        localStorage.setItem(USER_ID_KEY, data.me.ID);
      })
      .catch(() => setError('プロフィールの取得に失敗しました'));
  }, []);

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem' }}>
        <h1>マイページ</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {profile && (
          <dl>
            <dt>ユーザーID</dt>
            <dd>{profile.userID}</dd>
            <dt>名前</dt>
            <dd>{profile.name}</dd>
            <dt>メールアドレス</dt>
            <dd>{profile.email}</dd>
            <dt>ロール</dt>
            <dd>{profile.role}</dd>
            <dt>ステータス</dt>
            <dd>{profile.status}</dd>
            <dt>登録日時</dt>
            <dd>{profile.createdAt}</dd>
          </dl>
        )}
        <Link to="/mypage/settings">アカウント設定</Link>
      </main>
    </div>
  );
};
