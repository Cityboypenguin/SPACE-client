import { useEffect, useState } from 'react';
// 1. useLocation を追加
import { Link, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import styles from './UserDashboard.module.css';

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
  const { userId } = useAuth();
  const { profile, loading, error } = useProfile(userId);

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

      <main className={styles.main}>
        <h1>マイページ</h1>
        <Link to="/mypage/profile-edit">プロフィール編集</Link>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {profile ? (
          <div>
            <div className={styles.profileHeader}>
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.user.name}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {profile.user.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 style={{ margin: 0 }}>{profile.user.name}</h2>
                <p style={{ margin: 0, color: '#666' }}>@{profile.user.accountID}</p>
                <h2 className={styles.displayName}>{profile.user.name}</h2>
                <p className={styles.username}>@{profile.username}</p>
              </div>
            </div>

            <dl className={styles.profileList}>
              <dt className={styles.profileLabel}>自己紹介</dt>
              <dd>{profile.bio || '未設定'}</dd>
              <dt className={styles.profileLabel}>学年</dt>
              <dd>{profile.grade != null && profile.grade !== 0 ? `${profile.grade}年` : '未設定'}</dd>
            </dl>

            <p className={styles.accountMeta}>
              ユーザーID: {profile.user.userID} / メールアドレス: {profile.user.email} / ロール: {profile.user.role} / ステータス: {profile.user.status}
            </p>
          </div>
        ) : (
          <p>プロフィールがまだ作成されていません</p>
        )}

        {account && (
          <p style={{ color: '#666', marginTop: '1.5rem' }}>
            ユーザーID: {account.accountID} / メールアドレス: {account.email} / ロール: {account.role} / ステータス: {account.status}
          </p>
        )}

        <Link to="/mypage/settings">アカウント設定</Link>
      </main>
    </div>
  );
};
