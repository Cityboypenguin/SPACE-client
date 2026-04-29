import { Link } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import styles from './UserDashboard.module.css';

export const UserDashboard = () => {
  const { userId } = useAuth();
  const { profile, loading, error } = useProfile(userId);

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      <UserHeader />
      <main className={styles.main}>
        <h1>マイページ</h1>
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

        <Link to="/mypage/settings">アカウント設定</Link>
      </main>
    </div>
  );
};
