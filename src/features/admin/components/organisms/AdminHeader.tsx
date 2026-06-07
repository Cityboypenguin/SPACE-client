import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutAdmin, ADMIN_TOKEN_KEY, ADMIN_REFRESH_TOKEN_KEY } from '../../api/auth';
import { getInquiries } from '../../api/inquiry';
import styles from './AdminHeader.module.css';

export const AdminHeader = () => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = () => {
    getInquiries('PENDING')
      .then((inquiries) => setPendingCount(inquiries.length))
      .catch(() => {});
  };

  useEffect(() => {
    refreshPendingCount();
    window.addEventListener('inquiry-status-updated', refreshPendingCount);
    return () => window.removeEventListener('inquiry-status-updated', refreshPendingCount);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      try {
        await logoutAdmin(token);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    navigate('/admin/login');
  };

  return (
    <>
      <header className={styles.header}>
        <h2 className={styles.logo} onClick={() => navigate('/admin')}>管理画面</h2>
        <nav className={styles.nav}>
          <button className={styles.navButton} onClick={() => navigate('/admin')}>ダッシュボード</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/users')}>ユーザー管理</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/communities')}>コミュニティ管理</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/posts')}>投稿管理</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/reports')}>通報管理</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/inquiries')}>
            問い合わせ管理
            {pendingCount > 0 && (
              <span className={styles.badge}>
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>
          <button className={styles.navButton} onClick={() => navigate('/admin/announcements')}>お知らせ管理</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/terms')}>利用規約管理</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/administrators')}>管理者管理</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/register')}>新規管理者登録</button>
          <button className={styles.navButton} onClick={() => navigate('/admin/maintenance')}>メンテナンス</button>
        </nav>
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
            <p style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 500, color: '#1e293b' }}>
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
                onClick={() => { setShowConfirm(false); void handleLogout(); }}
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
