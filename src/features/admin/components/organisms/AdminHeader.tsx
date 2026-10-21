import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutAdmin, ADMIN_TOKEN_KEY, ADMIN_REFRESH_TOKEN_KEY } from '../../api/auth';
import { getInquiries } from '../../api/inquiry';
import { getPendingReportCount } from '../../api/report';
import { UnreadCountBadge } from '../../../../components/atoms/UnreadCountBadge';
import styles from './AdminHeader.module.css';

const NAV_ITEMS = [
  { icon: '📊', label: 'ダッシュボード', path: '/admin' },
  { icon: '📈', label: 'アナリティクス', path: '/admin/analytics' },
  { icon: '👥', label: 'ユーザー管理', path: '/admin/users' },
  { icon: '💬', label: 'コミュニティ管理', path: '/admin/communities' },
  { icon: '📚', label: '授業管理', path: '/admin/courses' },
  { icon: '📝', label: '投稿管理', path: '/admin/posts' },
  { icon: '⚠️', label: '通報管理', path: '/admin/reports' },
  { icon: '✉️', label: '問い合わせ', path: '/admin/inquiries' },
  { icon: '📢', label: 'お知らせ管理', path: '/admin/announcements' },
  { icon: '📄', label: '利用規約管理', path: '/admin/terms' },
  { icon: '🛡️', label: '管理者管理', path: '/admin/administrators' },
  { icon: '➕', label: '新規管理者登録', path: '/admin/register' },
  { icon: '🔧', label: 'メンテナンス', path: '/admin/maintenance' },
] as const;

export const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [expanded, setExpanded] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // 未対応件数のステート（問い合わせ・通報）
  const [pendingInquiryCount, setPendingInquiryCount] = useState(0);
  const [pendingReportCount, setPendingReportCount] = useState(0);

  // 未読問い合わせ件数の取得
  const refreshPendingInquiries = () => {
    getInquiries('PENDING')
      .then((inquiries) => setPendingInquiryCount(inquiries.total))
      .catch(() => {});
  };

  // 未対応通報件数の取得
  const refreshPendingReports = () => {
    getPendingReportCount()
      .then((count) => setPendingReportCount(count))
      .catch(() => {});
  };

  useEffect(() => {
    refreshPendingInquiries();
    refreshPendingReports();

    // イベントリスナー登録（各詳細画面や一覧でステータスが更新された時に発火）
    window.addEventListener('inquiry-status-updated', refreshPendingInquiries);
    window.addEventListener('report-status-updated', refreshPendingReports);

    return () => {
      window.removeEventListener('inquiry-status-updated', refreshPendingInquiries);
      window.removeEventListener('report-status-updated', refreshPendingReports);
    };
  }, []);

  // サイドバーの開閉状態を body の data 属性へ反映（メインコンテンツの余白調整用）
  useEffect(() => {
    if (expanded) {
      document.body.setAttribute('data-admin-sidebar', 'expanded');
    } else {
      document.body.setAttribute('data-admin-sidebar', 'collapsed');
    }
  }, [expanded]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

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

  const isNavActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className={`${styles.header} ${expanded ? styles.expanded : ''}`}>
        {/* ハンバーガーボタン ＋ タイトル */}
        <div className={styles.topHeader}>
          <button
            type="button"
            className={styles.hamburgerBtn}
            onClick={() => setExpanded((prev) => !prev)}
            aria-label="メニュー開閉"
          >
            <span className={styles.hamburgerIcon}>
              <span />
              <span />
              <span />
            </span>
          </button>
          <span className={styles.logoText} onClick={() => handleNavigate('/admin')}>
            管理画面
          </span>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ icon, label, path }) => {
            const isActive = isNavActive(path);

            // ラベルに応じて表示するバッジ件数を切り替え
            const badgeCount =
              label === '問い合わせ' ? pendingInquiryCount :
              label === '通報管理' ? pendingReportCount : 0;

            return (
              <button
                key={path}
                type="button"
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => handleNavigate(path)}
                title={!expanded ? label : undefined}
              >
                <span className={styles.iconWrap}>
                  <span className={styles.icon}>{icon}</span>
                  {badgeCount > 0 && (
                    <span className={styles.badgeSlot}>
                      <UnreadCountBadge count={badgeCount} />
                    </span>
                  )}
                </span>
                <span className={styles.label}>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* 下部：ログアウトボタン */}
        <div className={styles.bottom}>
          <button
            type="button"
            className={`${styles.navItem} ${styles.logoutBtn}`}
            onClick={() => setShowConfirm(true)}
            title={!expanded ? 'ログアウト' : undefined}
          >
            <span className={styles.iconWrap}>
              <span className={styles.icon}>🚪</span>
            </span>
            <span className={styles.label}>ログアウト</span>
          </button>
        </div>
      </header>

      {/* ログアウト確認ダイアログ */}
      {showConfirm && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(false);
          }}
        >
          <div className={styles.modalCard}>
            <p className={styles.modalTitle}>ログアウトしますか？</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className={styles.modalCancelBtn}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  void handleLogout();
                }}
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
