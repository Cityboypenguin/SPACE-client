import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { useProfile } from '../hooks/useProfile';
import { storageUrl } from '../../../lib/storage';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useEffect } from 'react';
import { createFavoriteUser, deleteFavoriteUser, getFavoriteUsersByUserID } from '../api/favorite_user';
import { createBlocker, deleteBlocker, getBlockersByUserID } from '../api/block';
import styles from './UserPublicProfilePage.module.css';

export const UserPublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading, error } = useProfile(id);
  const { userId: currentUserId } = useAuth();
  const isMe = currentUserId === id;
  const [isFavorited, setIsFavorited] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id || isMe) return;

    let active = true;
    const fetchInitialStatus = async () => {
      try {
        const [favorites, blockers] = await Promise.all([
          getFavoriteUsersByUserID(currentUserId!),
          getBlockersByUserID(currentUserId!),
        ]);

        if (!active) return;

        setIsFavorited(favorites.some((u) => u.ID === id));
        setIsBlocked(blockers.some((u) => u.ID === id));
      } catch (err) {
        console.error('状態の取得に失敗しました', err);
      }
    };

    fetchInitialStatus();
    return () => { active = false; };
  }, [id, isMe]);

  const handleFavoriteToggle = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      if (isFavorited) {
        await deleteFavoriteUser(id);
        setIsFavorited(false);
      } else {
        await createFavoriteUser(id);
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('お気に入りの操作に失敗しました', err);
      alert('操作に失敗しました。');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!id) return;
    if (!isBlocked && !window.confirm('本当にこのユーザーをブロックしますか？')) {
      return;
    }

    setActionLoading(true);
    try {
      if (isBlocked) {
        await deleteBlocker(id);
        setIsBlocked(false);
      } else {
        await createBlocker(id);
        setIsBlocked(true);
        setIsFavorited(false);
      }
    } catch (err) {
      console.error('ブロックの操作に失敗しました', err);
      alert('操作に失敗しました。');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <UserHeader />
      <main className={styles.main}>
        <button onClick={() => navigate((location.state as { from?: string })?.from ?? '/search')}>← 戻る</button>
        <h1>ユーザー詳細</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loading && <p>読み込み中...</p>}
        {profile && (
          <div>
            <div className={styles.profileHeader}>
              {profile.avatarUrl ? (
                <img
                  src={storageUrl(profile.avatarUrl) ?? undefined}
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

            {!isMe && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', marginBottom: '16px' }}>
                {!isBlocked && (
                  <button
                    onClick={handleFavoriteToggle}
                    disabled={actionLoading}
                    style={{ padding: '8px 16px', cursor: 'pointer' }}
                  >
                    {isFavorited ? '★ お気に入り解除' : '☆ お気に入り登録'}
                  </button>
                )}

                <button
                  onClick={handleBlockToggle}
                  disabled={actionLoading}
                  style={{ padding: '8px 16px', color: 'red', cursor: 'pointer' }}
                >
                  {isBlocked ? 'ブロック解除' : 'ブロックする'}
                </button>
              </div>
            )}

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
