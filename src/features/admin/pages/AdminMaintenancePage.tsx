import { useEffect, useState } from 'react';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { ADMIN_TOKEN_KEY } from '../api/auth';
import { toggleMaintenanceMode, getMaintenanceMode } from '../api/maintenance';

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
      <main style={{ padding: '2rem' }}>
        <h1>メンテナンス管理</h1>

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <div style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            maxWidth: '480px',
          }}>
            <p style={{ marginBottom: '1rem' }}>
              現在の状態：
              <strong style={{ color: maintenanceEnabled ? '#c0392b' : '#27ae60' }}>
                {maintenanceEnabled ? ' メンテナンス中' : ' 稼働中'}
              </strong>
            </p>
            {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={toggling}
              style={{
                padding: '0.6rem 1.4rem',
                backgroundColor: maintenanceEnabled ? '#27ae60' : '#c0392b',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: toggling ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                opacity: toggling ? 0.7 : 1,
              }}
            >
              {toggling
                ? '処理中...'
                : maintenanceEnabled
                ? 'サーバーを再開する'
                : 'サーバーを停止する'}
            </button>
            {maintenanceEnabled && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#888' }}>
                メンテナンス中はユーザーのログイン・操作がすべてブロックされます。
              </p>
            )}
          </div>
        )}
      </main>

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
              width: '90%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
              {maintenanceEnabled ? 'サーバーを再開しますか？' : 'サーバーを停止しますか？'}
            </p>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
              {maintenanceEnabled
                ? 'ユーザーが通常通りアクセスできるようになります。'
                : 'ユーザーのログイン・操作がすべてブロックされます。'}
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
                onClick={() => { void handleConfirm(); }}
                style={{
                  padding: '0.5rem 1.5rem', borderRadius: 8,
                  border: 'none',
                  background: maintenanceEnabled ? '#27ae60' : '#c0392b',
                  cursor: 'pointer', fontWeight: 500, color: '#fff',
                }}
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
