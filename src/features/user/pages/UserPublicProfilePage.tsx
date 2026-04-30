import { useParams, useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { useProfile } from '../hooks/useProfile';
import styles from './UserPublicProfilePage.module.css';

export const UserPublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, loading, error } = useProfile(id);

  return (
    <div>
      <UserHeader />
      <main className={styles.main}>
        <button onClick={() => navigate('/search')}>← 検索に戻る</button>
        <h1>ユーザー詳細</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loading && <p>読み込み中...</p>}
        {profile && (
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
            </dl>
          </div>
        )}
      </main>
    </div>
  );
};
