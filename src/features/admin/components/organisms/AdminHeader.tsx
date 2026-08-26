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
      .then((inquiries) => setPendingCount(inquiries.total))
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
          <button className={styles.navButton} onClick={() => navigate('/admin/analytics')}>アナリティクス</button>
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
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}
        >
          <div className={styles.modalCard}>
            <p className={styles.modalTitle}>
              ログアウトしますか？
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowConfirm(false)}
                className={styles.modalCancelBtn}
              >
                キャンセル
              </button>
              <button
                onClick={() => { setShowConfirm(false); void handleLogout(); }}
                className={styles.modalDangerBtn}
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
