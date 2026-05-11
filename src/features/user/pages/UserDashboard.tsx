import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import styles from './UserDashboard.module.css';

export const UserDashboard = () => {
  const location = useLocation();
  const [flashMessage, setFlashMessage] = useState('');
  const { userId } = useAuth();
  const { profile, loading, error } = useProfile(userId);

  useEffect(() => {
    if (location.state && (location.state as { message?: string }).message) {
      setFlashMessage((location.state as { message: string }).message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <UserHeader />
      <main className={styles.main}>
        {flashMessage && (
          <p style={{ color: 'green', fontWeight: 'bold', marginBottom: '1rem' }}>
            {flashMessage}
          </p>
        )}

        <h1>マイページ</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {profile ? (
          <div>
            <div className={styles.profileHeader}>
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.user.name}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {profile.user.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className={styles.displayName}>{profile.user.name}</h2>
                <p className={styles.username}>@{profile.user.accountID}</p>
              </div>
            </div>

            <dl className={styles.profileList}>
              <dt className={styles.profileLabel}>自己紹介</dt>
              <dd>{profile.bio || '未設定'}</dd>
            </dl>

            <p className={styles.accountMeta}>
              アカウントID: {profile.user.accountID} / メールアドレス: {profile.user.email} / ロール: {profile.user.role} / ステータス: {profile.user.status}
            </p>
          </div>
        ) : (
          <p>プロフィールがまだ作成されていません</p>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          <Link to="/mypage/profile-edit">プロフィール編集</Link>
          <Link to="/mypage/settings">アカウント設定</Link>
        </div>
      </main>
    </div>
  );
};
