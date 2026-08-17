import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getAnalytics } from '../api/analytics';
import { getMaintenanceMode } from '../api/maintenance';
import { getInquiries } from '../api/inquiry';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';
import type { AnalyticsSummary } from '../api/analytics';

// ---- スタイル定数 ----
const pageStyle: React.CSSProperties = { padding: '2rem', maxWidth: 1100, margin: '0 auto' };
const sectionTitle: React.CSSProperties = {
  fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em',
  color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem',
};
const grid = (cols: number): React.CSSProperties => ({
  display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.75rem', marginBottom: '2rem',
});

type CardVariant = 'default' | 'alert' | 'warning' | 'ok';
const cardColors: Record<CardVariant, { bg: string; border: string; accent: string }> = {
  default: { bg: '#fff',       border: '#e2e8f0', accent: '#0f172a' },
  alert:   { bg: '#fef2f2',   border: '#fca5a5', accent: '#dc2626' },
  warning: { bg: '#fffbeb',   border: '#fcd34d', accent: '#d97706' },
  ok:      { bg: '#f0fdf4',   border: '#86efac', accent: '#16a34a' },
};

function KpiCard({
  label, value, sub, variant = 'default', onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  variant?: CardVariant;
  onClick?: () => void;
}) {
  const c = cardColors[variant];
  return (
    <div
      onClick={onClick}
      style={{
        background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
        padding: '1.2rem 1.4rem', cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,.1)'; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,.06)'; }}
    >
      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.7rem', fontWeight: 700, color: c.accent }}>{value}</div>
      {sub && <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>{sub}</div>}
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
      <main style={pageStyle}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.75rem', color: '#0f172a' }}>
          ダッシュボード
        </h1>

        {/* 要対応アラート */}
        <div style={sectionTitle}>要対応</div>
        <div style={grid(3)}>
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
        <div style={sectionTitle}>本日のサマリー</div>
        <div style={grid(4)}>
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
        <div style={sectionTitle}>インフラ・パフォーマンス</div>
        <div style={grid(4)}>
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
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={() => navigate('/admin/analytics')}
            style={{
              padding: '0.6rem 1.4rem', borderRadius: 8, border: 'none',
              background: '#3b82f6', color: '#fff', fontWeight: 600,
              cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            詳細アナリティクスを見る →
          </button>
        </div>
      </main>
    </div>
  );
};
