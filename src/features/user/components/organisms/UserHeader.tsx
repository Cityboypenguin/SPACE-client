import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import styles from './UserHeader.module.css';

export const UserHeader = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { unreadCount } = useNotification();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <h2 className={styles.logo} onClick={() => navigate('/mypage')}>S-Universe</h2>
        <nav className={styles.nav}>
          <button className={styles.navButton} onClick={() => navigate('/mypage')}>ホーム</button>
          <button className={styles.navButton} onClick={() => navigate('/search')}>ユーザー検索</button>
          <button className={styles.navButton} onClick={() => navigate('/dm')}>DM</button>
          <button className={styles.navButton} onClick={() => navigate('/posts')}>投稿</button>
          <button className={styles.navButton} onClick={() => navigate('/community')}>コミュニティ</button>
        </nav>
        <button
          className={styles.navButton}
          onClick={() => navigate('/notifications')}
          style={{ position: 'relative', padding: '0.25rem 0.5rem' }}
        >
          🔔
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <button className={styles.logoutButton} onClick={() => setShowConfirm(true)}>ログアウト</button>
      </header>

      {showConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}
        >
          <div
            style={{
              background: '#fff', borderRadius: 12, padding: '2rem',
              width: '90%', maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 500 }}>
              ログアウトしますか？
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: 8,
                  border: '1px solid #cbd5e1', background: '#fff',
                  cursor: 'pointer', fontWeight: 500, color: '#64748b',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={() => { setShowConfirm(false); void logout(); }}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: 8,
                  border: 'none', background: '#ef4444',
                  cursor: 'pointer', fontWeight: 500, color: '#fff',
                }}
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
