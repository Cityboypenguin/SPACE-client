import { useEffect, useState } from 'react';
// 1. useLocation を追加
import { Link, useLocation } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { getMyProfile, getProfileByUserID, type Profile, type UserProfile } from '../api/profile';
import { USER_ID_KEY } from '../api/auth';

export const UserDashboard = () => {
  const location = useLocation();
  const [flashMessage, setFlashMessage] = useState('');

  useEffect(() => {
    // 遷移時にメッセージがあればStateに入れる
    if (location.state && location.state.message) {
      setFlashMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const [account, setAccount] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    getMyProfile()
      .then(async (data) => {
        if (!active) return;

        setAccount(data.me);
        localStorage.setItem(USER_ID_KEY, data.me.ID);

        const profileData = await getProfileByUserID(data.me.ID);
        if (!active) return;

        setProfile(profileData.getProfileByUserID);
      })
      .catch(() => {
        if (active) setError('プロフィールの取得に失敗しました');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem' }}>
        {flashMessage && (
          <p style={{ color: 'green', fontWeight: 'bold', marginBottom: '1rem' }}>
            {flashMessage}
          </p>
        )}

        <h1>マイページ</h1>
        <Link to="/mypage/profile-edit">プロフィール編集</Link>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {profile ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.user.name}
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: '#ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    color: '#fff',
                  }}
                >
                  {profile.user.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 style={{ margin: 0 }}>{profile.user.name}</h2>
                <p style={{ margin: 0, color: '#666' }}>@{profile.username}</p>
              </div>
            </div>

            <dl style={{ lineHeight: 2 }}>
              <dt style={{ fontWeight: 'bold' }}>自己紹介</dt>
              <dd>{profile.bio || '未設定'}</dd>
              <dt style={{ fontWeight: 'bold' }}>学年</dt>
              <dd>{profile.grade != null && profile.grade !== 0 ? `${profile.grade}年` : '未設定'}</dd>
            </dl>
          </div>
        ) : (
          <p>プロフィールがまだ作成されていません</p>
        )}

        {account && (
          <p style={{ color: '#666', marginTop: '1.5rem' }}>
            ユーザーID: {account.userID} / メールアドレス: {account.email} / ロール: {account.role} / ステータス: {account.status}
          </p>
        )}

        <Link to="/mypage/settings">アカウント設定</Link>
      </main>
    </div>
  );
};
