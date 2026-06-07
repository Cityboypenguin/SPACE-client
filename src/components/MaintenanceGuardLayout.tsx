import { useEffect, useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { API_URL } from '../lib/graphql';

const MAINTENANCE_KEY = 'space_maintenance';

/**
 * メンテナンス中にユーザー向けルートへのアクセスを遮断するレイアウトコンポーネント。
 *
 * - localStorage フラグがセットされていれば即座に /maintenance へリダイレクト
 * - フラグが未セットの場合でも、サーバーへ非同期チェックを行い
 *   503 が返ってきたら /maintenance へリダイレクト（フレッシュブラウザ対応）
 * - チェック中はページを表示しない（フラッシュ防止）
 */
export const MaintenanceGuardLayout = () => {
  const navigate = useNavigate();

  const alreadyFlagged = localStorage.getItem(MAINTENANCE_KEY) === 'true';

  // 既にフラグあり → 'maintenance' 確定、サーバー確認不要
  const [status, setStatus] = useState<'checking' | 'ok' | 'maintenance'>(
    alreadyFlagged ? 'maintenance' : 'checking',
  );

  useEffect(() => {
    if (alreadyFlagged) return;

    // フラグ未セットでも、サーバーが 503 を返すか確認する（URL 直打ち対応）
    fetch(API_URL, { method: 'GET' })
      .then((res) => {
        if (res.status === 503) {
          localStorage.setItem(MAINTENANCE_KEY, 'true');
          setStatus('maintenance');
        } else {
          setStatus('ok');
        }
      })
      .catch(() => {
        // ネットワークエラーは "ok" 扱い（通常の 401/404 フローに任せる）
        setStatus('ok');
      });
  }, [alreadyFlagged, navigate]);

  if (status === 'maintenance') {
    return <Navigate to="/maintenance" replace />;
  }

  // サーバー確認中は何も表示しない（フォームが一瞬見えるのを防ぐ）
  if (status === 'checking') {
    return null;
  }

  return <Outlet />;
};
