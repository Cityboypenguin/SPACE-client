import { useEffect, useState } from 'react';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { ADMIN_TOKEN_KEY } from '../api/auth';
import { toggleMaintenanceMode, getMaintenanceMode } from '../api/maintenance';
import styles from '../styles/AdminShared.module.css';

export const AdminMaintenancePage = () => {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;
    getMaintenanceMode(token)
      .then(setMaintenanceEnabled)
      .catch(() => setError('メンテナンス状態の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = async () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return;
    setShowConfirm(false);
    setError('');
    setToggling(true);
    try {
      const next = !maintenanceEnabled;
      await toggleMaintenanceMode(next, token);
      setMaintenanceEnabled(next);
    } catch {
      setError('切り替えに失敗しました。もう一度お試しください。');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.page}>
        <h1>メンテナンス管理</h1>

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <div className={styles.maintenanceCard}>
            <p className={styles.statusParagraph}>
              現在の状態：
              <strong className={maintenanceEnabled ? styles.errorText : styles.successText}>
                {maintenanceEnabled ? ' メンテナンス中' : ' 稼働中'}
              </strong>
            </p>
            {error && <p className={styles.formError}>{error}</p>}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={toggling}
              className={`${styles.maintenanceToggleButton} ${maintenanceEnabled ? styles.successButton : styles.dangerFillButton} ${toggling ? styles.disabled : ''}`}
            >
              {toggling
                ? '処理中...'
                : maintenanceEnabled
                ? 'サーバーを再開する'
                : 'サーバーを停止する'}
            </button>
            {maintenanceEnabled && (
              <p className={styles.maintenanceHelp}>
                メンテナンス中はユーザーのログイン・操作がすべてブロックされます。
              </p>
            )}
          </div>
        )}
      </main>

      {showConfirm && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}
        >
          <div className={styles.confirmDialog}>
            <p className={styles.confirmTitle}>
              {maintenanceEnabled ? 'サーバーを再開しますか？' : 'サーバーを停止しますか？'}
            </p>
            <p className={styles.confirmText}>
              {maintenanceEnabled
                ? 'ユーザーが通常通りアクセスできるようになります。'
                : 'ユーザーのログイン・操作がすべてブロックされます。'}
            </p>
            <div className={styles.confirmActions}>
              <button
                onClick={() => setShowConfirm(false)}
                className={styles.secondaryButtonLarge}
              >
                キャンセル
              </button>
              <button
                onClick={() => { void handleConfirm(); }}
                className={`${styles.primaryButtonLargeRounded} ${maintenanceEnabled ? styles.successButton : styles.dangerFillButton}`}
              >
                {maintenanceEnabled ? '再開する' : '停止する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
