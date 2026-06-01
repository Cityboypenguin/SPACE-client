import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { useProfile } from '../hooks/useProfile';
import { storageUrl } from '../../../lib/storage';
import { createReport } from '../api/report';
import styles from './UserPublicProfilePage.module.css';

export const UserPublicProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading, error } = useProfile(id);
  const [reporting, setReporting] = useState(false);

  const handleReportUser = async () => {
    if (!profile || !id) return;
    const customReason = window.prompt(
      `ユーザー「${profile.user.name}」を通報する具体的な理由を入力してください。\n（例: スパム行為、嫌がらせ、不適切な発言など）`
    );
    if (customReason === null) return;
    if (customReason.trim() === '') {
      alert('通報には具体的な理由の入力が必要です。');
      return;
    }

    try {
      setReporting(true);
      await createReport({
        targetType: 'USER',
        targetID: id,
        reason: 'ユーザー報告',
        customReason: customReason
      });
      alert('通報を送信しました。ご協力ありがとうございました。');
    } catch (err) {
      console.error(err);
      alert('通報の送信に失敗しました。');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div>
      <UserHeader />
      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={() => navigate((location.state as { from?: string })?.from ?? '/search')}>← 戻る</button>
          
          {profile && (
            <button
              onClick={handleReportUser}
              disabled={reporting}
              style={{
                padding: '0.4rem 1rem',
                background: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fca5a5',
                borderRadius: '20px',
                fontWeight: 600,
                cursor: reporting ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#fee2e2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fef2f2')}
            >
              {reporting ? '送信中...' : '⚠️ このユーザーを通報'}
            </button>
          )}
        </div>

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
