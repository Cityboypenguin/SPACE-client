import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getAnalytics } from '../api/analytics';
import { getMaintenanceMode } from '../api/maintenance';
import { getInquiries } from '../api/inquiry';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';
import type { AnalyticsSummary } from '../api/analytics';
import styles from '../styles/AdminShared.module.css';

type CardVariant = 'default' | 'alert' | 'warning' | 'ok';

function KpiCard({
  label, value, sub, variant = 'default', onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  variant?: CardVariant;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`${styles.kpiCard} ${onClick ? styles.kpiCardClickable : ''}`}
      data-variant={variant}
    >
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  );
}

function fmtMs(ms: number) {
  return Number.isFinite(ms) && ms > 0 ? `${ms.toFixed(1)}ms` : '—';
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [pendingInquiries, setPendingInquiries] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? '';
    Promise.all([
      getAnalytics().catch(() => null),
      getMaintenanceMode(token).catch(() => null),
      getInquiries('PENDING', 1, 0).catch(() => null),
    ]).then(([a, m, inq]) => {
      setAnalytics(a);
      setMaintenance(m);
      setPendingInquiries(inq?.total ?? null);
    }).finally(() => setLoading(false));
  }, []);

  const pendingReports = analytics?.pendingReports ?? null;

  return (
    <div>
      <AdminHeader />
      <main className={styles.dashboardPage}>
        <h1 className={styles.dashboardTitle}>
          ダッシュボード
        </h1>

        {/* 要対応アラート */}
        <div className={styles.dashboardSectionTitle}>要対応</div>
        <div className={styles.dashboardGridThree}>
          <KpiCard
            label="未対応の通報"
            value={loading ? '…' : (pendingReports ?? '—')}
            sub={pendingReports ? '確認してください' : undefined}
            variant={pendingReports ? 'alert' : 'ok'}
            onClick={() => navigate('/admin/reports')}
          />
          <KpiCard
            label="未対応の問い合わせ"
            value={loading ? '…' : (pendingInquiries ?? '—')}
            sub={pendingInquiries ? '確認してください' : undefined}
            variant={pendingInquiries ? 'alert' : 'ok'}
            onClick={() => navigate('/admin/inquiries')}
          />
          <KpiCard
            label="メンテナンスモード"
            value={loading ? '…' : (maintenance === null ? '—' : maintenance ? 'ON' : 'OFF')}
            sub="クリックで設定へ"
            variant={maintenance ? 'warning' : 'ok'}
            onClick={() => navigate('/admin/maintenance')}
          />
        </div>

        {/* KPIサマリー */}
        <div className={styles.dashboardSectionTitle}>本日のサマリー</div>
        <div className={styles.dashboardGridFour}>
          <KpiCard
            label="アクティブユーザー（直近3日）"
            value={loading ? '…' : (analytics?.currentActiveUsers.toLocaleString() ?? '—')}
          />
          <KpiCard
            label="本日のアクティブユーザー"
            value={loading ? '…' : (analytics?.dau.toLocaleString() ?? '—')}
            sub={analytics ? `MAU: ${analytics.mau.toLocaleString()}` : undefined}
          />
          <KpiCard
            label="本日の新規登録"
            value={loading ? '…' : (analytics?.newUsersToday.toLocaleString() ?? '—')}
            sub={analytics ? `総ユーザー: ${analytics.totalUsers.toLocaleString()}` : undefined}
          />
          <KpiCard
            label="本日の投稿数"
            value={loading ? '…' : (analytics?.postsToday.toLocaleString() ?? '—')}
            sub={analytics ? `コメント: ${analytics.commentsToday.toLocaleString()}` : undefined}
          />
          <KpiCard
            label="本日のDM送信数"
            value={loading ? '…' : (analytics?.messagesToday.toLocaleString() ?? '—')}
          />
        </div>

        {/* インフラ状態 */}
        <div className={styles.dashboardSectionTitle}>インフラ・パフォーマンス</div>
        <div className={styles.dashboardGridFour}>
          <KpiCard
            label="WebSocket接続数"
            value={loading ? '…' : (analytics?.webSocketConnections.toLocaleString() ?? '—')}
          />
          <KpiCard
            label="SSE接続数"
            value={loading ? '…' : (analytics?.sseConnections.toLocaleString() ?? '—')}
          />
          <KpiCard
            label="APIエラーレート (5xx)"
            value={loading ? '…' : (analytics ? `${analytics.errorRate5xx.toFixed(2)}%` : '—')}
            variant={analytics && analytics.errorRate5xx > 1 ? 'alert' : analytics && analytics.errorRate5xx > 0.1 ? 'warning' : 'ok'}
          />
          <KpiCard
            label="レスポンスタイム p95"
            value={loading ? '…' : fmtMs(analytics?.p95ResponseTimeMs ?? 0)}
            variant={analytics && analytics.p95ResponseTimeMs > 2000 ? 'alert' : analytics && analytics.p95ResponseTimeMs > 500 ? 'warning' : 'ok'}
          />
          <KpiCard
            label="レスポンスタイム p99"
            value={loading ? '…' : fmtMs(analytics?.p99ResponseTimeMs ?? 0)}
          />
        </div>

        {/* 詳細へのリンク */}
        <div className={styles.alignRight}>
          <button
            onClick={() => navigate('/admin/analytics')}
            className={styles.primaryButtonLargeRounded}
          >
            詳細アナリティクスを見る →
          </button>
        </div>
      </main>
    </div>
  );
};
