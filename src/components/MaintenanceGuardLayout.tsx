import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { HEALTH_URL } from '../lib/graphql';

const MAINTENANCE_KEY = 'space_maintenance';

/**
 * メンテナンス中にユーザー向けルートへのアクセスを遮断するレイアウトコンポーネント。
 *
 * - 毎回サーバーへ確認し、503 が返れば /maintenance へリダイレクト
 * - 503 以外ならメンテナンス終了とみなし、localStorage フラグをクリアしてページを表示
 * - ネットワークエラーのときは localStorage フラグをフォールバックとして使用
 */
export const MaintenanceGuardLayout = () => {
  const [status, setStatus] = useState<'checking' | 'ok' | 'maintenance'>('checking');

  useEffect(() => {
    // localStorage のフラグの有無に関わらず、常にサーバーへ確認する。
    // これにより「メンテナンス解除後もフラグが残り続ける」問題を防ぐ。
    fetch(HEALTH_URL, { method: 'GET' })
      .then((res) => {
        if (res.status === 503) {
          localStorage.setItem(MAINTENANCE_KEY, 'true');
          setStatus('maintenance');
        } else {
          // メンテナンス終了（または未実施）→ フラグをクリア
          localStorage.removeItem(MAINTENANCE_KEY);
          setStatus('ok');
        }
      })
      .catch(() => {
        // ネットワークエラー時は localStorage フラグをフォールバックとして使う
        const flagged = localStorage.getItem(MAINTENANCE_KEY) === 'true';
        setStatus(flagged ? 'maintenance' : 'ok');
      });
  }, []);

  if (status === 'maintenance') {
    return <Navigate to="/maintenance" replace />;
  }

  // サーバー確認中は何も表示しない（フォームが一瞬見えるのを防ぐ）
  if (status === 'checking') {
    return null;
  }

  return <Outlet />;
};
