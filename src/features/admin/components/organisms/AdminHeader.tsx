import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutAdmin, ADMIN_TOKEN_KEY, ADMIN_REFRESH_TOKEN_KEY } from '../../api/auth';
import { getInquiries } from '../../api/inquiry';
import { getPendingReportCount } from '../../api/report';
import { UnreadCountBadge } from '../../../../components/atoms/UnreadCountBadge';
import styles from './AdminHeader.module.css';

// SVG アイコンのインポート
import homeIcon from '../../../../assets/パーツ_ホーム.svg';
import postIcon from '../../../../assets/パーツ_メッセージ編集.svg';
import communityIcon from '../../../../assets/パーツ_コミュニティマーク.svg';
import timetableIcon from '../../../../assets/パーツ_時間割.svg';
import settingsIcon from '../../../../assets/パーツ_設定.svg';
import reportIcon from '../../../../assets/パーツ_通報.svg';

const NAV_ITEMS = [
  { label: 'ダッシュボード', path: '/admin', icon: homeIcon, iconSize: 20 },
  { label: 'アナリティクス', path: '/admin/analytics', emoji: '📊' },
  { label: 'ユーザー管理', path: '/admin/users', emoji: '👥' },
  { label: 'コミュニティ管理', path: '/admin/communities', icon: communityIcon, iconSize: 20 },
  { label: '投稿管理', path: '/admin/posts', icon: postIcon, iconSize: 20 },
  { label: '授業管理', path: '/admin/courses', icon: timetableIcon, iconSize: 20 },
  { label: '通報管理', path: '/admin/reports', icon: reportIcon, iconSize: 20 },
  { label: '問い合わせ管理', path: '/admin/inquiries', emoji: '✉️' },
  { label: 'お知らせ管理', path: '/admin/announcements', emoji: '📢' },
  { label: '利用規約管理', path: '/admin/terms', emoji: '📜' },
  { label: '管理者管理', path: '/admin/administrators', emoji: '👮', exact: true },
  { label: '新規管理者登録', path: '/admin/register', emoji: '➕' },
  { label: 'メンテナンス', path: '/admin/maintenance', icon: settingsIcon, iconSize: 20 },
];

export const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [expanded, setExpanded] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
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

    window.addEventListener('inquiry-status-updated', refreshPendingInquiries);
    window.addEventListener('report-status-updated', refreshPendingReports);

    return () => {
      window.removeEventListener('inquiry-status-updated', refreshPendingInquiries);
      window.removeEventListener('report-status-updated', refreshPendingReports);
    };
  }, []);

  // サイドバーの開閉状態を body の data 属性へ反映
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

  const isNavActive = (path: string, exact?: boolean) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    if (exact) {
      return location.pathname === path;
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
          {NAV_ITEMS.map((item) => {
            const isActive = isNavActive(item.path, item.exact);

            const badgeCount =
              item.label === '問い合わせ管理' ? pendingInquiryCount :
              item.label === '通報管理' ? pendingReportCount : 0;

            return (
              <button
                key={item.path}
                type="button"
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => handleNavigate(item.path)}
                title={!expanded ? item.label : undefined}
              >
                <span className={styles.iconWrap}>
                  {item.icon ? (
                    <img
                      src={item.icon}
                      alt={item.label}
                      width={item.iconSize ?? 20}
                      height={item.iconSize ?? 20}
                      className={styles.icon}
                    />
                  ) : (
                    <span className={styles.icon} style={{ fontSize: '18px' }}>
                      {item.emoji}
                    </span>
                  )}

                  {badgeCount > 0 && (
                    <span className={styles.badgeSlot}>
                      <UnreadCountBadge count={badgeCount} />
                    </span>
                  )}
                </span>
                <span className={styles.label}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 最下部：ログアウトボタン */}
        <div className={styles.bottom}>
          <button
            type="button"
            className={`${styles.navItem} ${styles.logoutBtn}`}
            onClick={() => setShowLogoutConfirm(true)}
            title={!expanded ? 'ログアウト' : undefined}
          >
            <span className={styles.iconWrap}>
              <span className={styles.icon} style={{ fontSize: '18px' }}>🚪</span>
            </span>
            <span className={styles.label}>ログアウト</span>
          </button>
        </div>
      </header>

      {/* ログアウト確認ダイアログ */}
      {showLogoutConfirm && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLogoutConfirm(false);
          }}
        >
          <div className={styles.modalCard}>
            <p className={styles.modalTitle}>ログアウトしますか？</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className={styles.modalCancelBtn}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
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
