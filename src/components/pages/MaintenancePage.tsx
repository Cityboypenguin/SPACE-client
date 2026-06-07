import { useEffect } from 'react';
import { API_URL } from '../../lib/graphql';

const MAINTENANCE_KEY = 'space_maintenance';
const POLL_INTERVAL_MS = 30_000; // 30秒ごとにサーバーへ確認

/**
 * メンテナンス中に表示するページ。
 * 30秒ごとにサーバーへリクエストを送り、503 以外のレスポンスが返ってきたら
 * メンテナンス終了とみなして localStorage フラグをクリアし、ログイン画面へ戻す。
 */
export const MaintenancePage = () => {
  useEffect(() => {
    const checkIfOver = async () => {
      try {
        const res = await fetch(API_URL, { method: 'GET' });
        if (res.status !== 503) {
          localStorage.removeItem(MAINTENANCE_KEY);
          const hasToken = !!localStorage.getItem('space_user_token');
          window.location.href = hasToken ? '/mypage' : '/login';
        }
      } catch {
        // ネットワークエラーは無視（次のポーリングまで待つ）
      }
    };

    // マウント時に即座に1回チェックし、その後は定期的にポーリングする
    void checkIfOver();
    const timer = setInterval(checkIfOver, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>メンテナンス中</h1>
      <p style={{ fontSize: '1.1rem', color: '#555', maxWidth: '480px', lineHeight: 1.8 }}>
        現在、システムメンテナンスを実施しています。<br />
        ご不便をおかけして申し訳ございません。<br />
        メンテナンス終了後、自動的にページへ移動します。
      </p>
    </div>
  );
};
