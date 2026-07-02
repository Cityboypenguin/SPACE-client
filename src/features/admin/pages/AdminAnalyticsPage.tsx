import { useEffect, useState } from 'react';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getAnalytics, getCommunityAnalytics } from '../api/analytics';
import { TimeSeriesChart } from '../components/organisms/TimeSeriesChart';
import type { AnalyticsSummary, CommunityStatItem } from '../api/analytics';
import { downloadCsv } from '../lib/exportCsv';

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 10, padding: '1.2rem 1.5rem',
  boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: '0.75rem',
};
const grid = (cols: number): React.CSSProperties => ({
  display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.75rem', marginBottom: '1.5rem',
});
const section: React.CSSProperties = { marginBottom: '2rem' };
const sectionTitle: React.CSSProperties = {
  fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.4rem',
};
const label: React.CSSProperties = { fontSize: '0.78rem', color: '#64748b', marginBottom: 4 };
const value: React.CSSProperties = { fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' };
const subValue: React.CSSProperties = { fontSize: '0.85rem', color: '#475569' };

function Stat({ label: l, value: v, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={card}>
      <div style={label}>{l}</div>
      <div style={value}>{v}</div>
      {sub && <div style={subValue}>{sub}</div>}
    </div>
  );
}

function fmt(n: number, decimals = 1) {
  return Number.isFinite(n) ? n.toFixed(decimals) : '—';
}
function fmtInt(n: number) { return Number.isFinite(n) ? n.toLocaleString() : '—'; }
function fmtSec(sec: number) {
  if (!Number.isFinite(sec) || sec === 0) return '—';
  if (sec < 60) return `${Math.round(sec)}秒`;
  return `${Math.floor(sec / 60)}分${Math.round(sec % 60)}秒`;
}

function today() { return new Date().toISOString().slice(0, 10); }

function exportSummaryCsv(data: AnalyticsSummary) {
  const rows: (string | number)[][] = [
    ['指標', '値'],
    ['ユーザー数（累計）', data.totalUsers],
    ['凍結ユーザー数', data.frozenUsersCount],
    ['新規登録（本日）', data.newUsersToday],
    ['新規登録（今週）', data.newUsersThisWeek],
    ['新規登録（今月）', data.newUsersThisMonth],
    ['DAU', data.dau],
    ['WAU', data.wau],
    ['MAU', data.mau],
    ['DAU/MAU比率（%）', data.dauMauRatio],
    ['投稿数', data.totalPosts],
    ['削除済み投稿数', data.totalDeletedPosts],
    ['コメント数', data.totalComments],
    ['いいね数', data.totalLikes],
    ['コミュニティ数', data.totalCommunities],
    ['DM送信数', data.totalMessages],
    ['DM送信ユーザー数', data.uniqueDMSenders],
    ['通報数', data.totalReports],
    ['未対応通報数', data.pendingReports],
    ['解決済み通報数', data.resolvedReports],
    ['ブロック数', data.totalBlocks],
    ['問い合わせ数', data.totalInquiries],
    ['本日の投稿数', data.postsToday],
    ['本日のコメント数', data.commentsToday],
    ['本日のDM数', data.messagesToday],
    ['投稿あたり平均いいね', data.avgLikesPerPost],
    ['投稿あたり平均コメント', data.avgCommentsPerPost],
    ['テキストのみの投稿数', data.postsTextOnly],
    ['画像付き投稿数', data.postsWithImage],
    ['動画付き投稿数', data.postsWithVideo],
    ['アクティブなコミュニティ（30日）', data.activeCommunitiesLast30Days],
    ['コミュニティ平均メンバー数', data.avgCommunityMembers],
    ['ユーザー平均参加コミュニティ数', data.avgCommunitiesPerUser],
    ['フォロー総数', data.totalFollows],
    ['ユーザー平均フォロワー数', data.avgFollowersPerUser],
    ['プロフィール設定済みユーザー数', data.usersWithProfile],
    ['アバター設定済みユーザー数', data.usersWithAvatar],
    ['初投稿済みユーザー数', data.usersWithPost],
    ['オンボーディング完了率（%）', data.onboardingCompleteRate],
    ['初投稿までの平均時間（分）', data.avgTimeToFirstPostMinutes],
    ['通知総数', data.totalNotifications],
    ['開封済み通知数', data.readNotifications],
    ['通知開封率（%）', data.notificationReadRate],
    ['平均セッション時間（秒）', data.avgSessionDurationSeconds],
    ['1日あたり平均セッション数', data.avgSessionsPerDay],
    ['平均スクロール深度（%）', data.avgScrollDepth],
    ['WebSocket接続数', data.webSocketConnections],
    ['SSE接続数', data.sseConnections],
    ['エラーレート5xx（%）', data.errorRate5xx],
    ['APIレスポンス p50（ms）', data.p50ResponseTimeMs],
    ['APIレスポンス p95（ms）', data.p95ResponseTimeMs],
    ['APIレスポンス p99（ms）', data.p99ResponseTimeMs],
  ];
  downloadCsv(`analytics_summary_${today()}.csv`, rows);
}

function exportPageViewsCsv(stats: AnalyticsSummary['pageViewStats']) {
  const rows: (string | number)[][] = [
    ['ページ', '平均滞在時間（秒）', '平均スクロール深度（%）', '表示回数'],
    ...stats.map(pv => [pv.pagePath, pv.avgDurationSeconds, pv.avgMaxScrollDepth, pv.totalViews]),
  ];
  downloadCsv(`page_views_${today()}.csv`, rows);
}

function exportCommunitiesCsv(communities: CommunityStatItem[]) {
  const rows: (string | number)[][] = [
    ['コミュニティ名', 'メンバー数', 'メッセージ数'],
    ...communities.map(c => [c.name, c.memberCount, c.messageCount]),
  ];
  downloadCsv(`community_stats_${today()}.csv`, rows);
}

export const AdminAnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [communities, setCommunities] = useState<CommunityStatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getAnalytics(), getCommunityAnalytics(10)])
      .then(([a, c]) => { setData(a); setCommunities(c.items); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <><AdminHeader /><main style={{ padding: '2rem' }}><p>読み込み中...</p></main></>;
  if (error) return <><AdminHeader /><main style={{ padding: '2rem' }}><p style={{ color: 'red' }}>{error}</p></main></>;
  if (!data) return null;

  return (
    <>
      <AdminHeader />
      <main style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>アナリティクス</h1>
          <button
            onClick={() => exportSummaryCsv(data)}
            style={{
              padding: '0.5rem 1.2rem', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600,
              border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer',
            }}
          >
            ↓ サマリーをCSV出力
          </button>
        </div>

        {/* 時系列グラフ */}
        <div style={section}>
          <TimeSeriesChart />
        </div>

        {/* 基本集計 */}
        <div style={section}>
          <div style={sectionTitle}>基本集計</div>
          <div style={grid(4)}>
            <Stat label="ユーザー数（累計）" value={fmtInt(data.totalUsers)} sub={`凍結中: ${fmtInt(data.frozenUsersCount)}`} />
            <Stat label="新規登録（本日）" value={fmtInt(data.newUsersToday)} />
            <Stat label="新規登録（今週）" value={fmtInt(data.newUsersThisWeek)} />
            <Stat label="新規登録（今月）" value={fmtInt(data.newUsersThisMonth)} />
            <Stat label="投稿数" value={fmtInt(data.totalPosts)} sub={`削除済: ${fmtInt(data.totalDeletedPosts)}`} />
            <Stat label="コメント数" value={fmtInt(data.totalComments)} />
            <Stat label="いいね数" value={fmtInt(data.totalLikes)} />
            <Stat label="コミュニティ数" value={fmtInt(data.totalCommunities)} />
            <Stat label="DM送信数" value={fmtInt(data.totalMessages)} sub={`送信ユーザー: ${fmtInt(data.uniqueDMSenders)}`} />
            <Stat label="通報数" value={fmtInt(data.totalReports)} sub={`未対応: ${fmtInt(data.pendingReports)}`} />
            <Stat label="ブロック数" value={fmtInt(data.totalBlocks)} />
            <Stat label="問い合わせ数" value={fmtInt(data.totalInquiries)} />
          </div>
        </div>

        {/* アクティビティ */}
        <div style={section}>
          <div style={sectionTitle}>アクティビティ・継続率</div>
          <div style={grid(4)}>
            <Stat label="DAU（本日）" value={fmtInt(data.dau)} />
            <Stat label="WAU（今週）" value={fmtInt(data.wau)} />
            <Stat label="MAU（今月）" value={fmtInt(data.mau)} />
            <Stat label="DAU/MAU比率（スティッキネス）" value={`${fmt(data.dauMauRatio)}%`} />
          </div>
        </div>

        {/* セッション */}
        <div style={section}>
          <div style={sectionTitle}>セッション</div>
          <div style={grid(4)}>
            <Stat label="平均セッション時間" value={fmtSec(data.avgSessionDurationSeconds)} />
            <Stat label="1日あたり平均セッション数" value={fmt(data.avgSessionsPerDay)} />
            <Stat label="平均スクロール深度" value={`${fmt(data.avgScrollDepth)}%`} />
          </div>
          {data.pageViewStats.length > 0 && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600 }}>画面別滞在時間（上位{data.pageViewStats.length}ページ）</span>
                <button
                  onClick={() => exportPageViewsCsv(data.pageViewStats)}
                  style={{ padding: '0.25rem 0.75rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 500, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer' }}
                >↓ CSV</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem', color: '#64748b' }}>ページ</th>
                    <th style={{ padding: '0.5rem', color: '#64748b' }}>平均滞在時間</th>
                    <th style={{ padding: '0.5rem', color: '#64748b' }}>平均スクロール深度</th>
                    <th style={{ padding: '0.5rem', color: '#64748b' }}>表示回数</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pageViewStats.map((pv) => (
                    <tr key={pv.pagePath} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{pv.pagePath}</td>
                      <td style={{ padding: '0.5rem' }}>{fmtSec(pv.avgDurationSeconds)}</td>
                      <td style={{ padding: '0.5rem' }}>{fmt(pv.avgMaxScrollDepth)}%</td>
                      <td style={{ padding: '0.5rem' }}>{fmtInt(pv.totalViews)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div style={section}>
          <div style={sectionTitle}>コンテンツ・エンゲージメント</div>
          <div style={grid(4)}>
            <Stat label="本日の投稿数" value={fmtInt(data.postsToday)} />
            <Stat label="本日のコメント数" value={fmtInt(data.commentsToday)} />
            <Stat label="本日のDM数" value={fmtInt(data.messagesToday)} />
            <Stat label="投稿あたり平均いいね" value={fmt(data.avgLikesPerPost)} />
            <Stat label="投稿あたり平均コメント" value={fmt(data.avgCommentsPerPost)} />
            <Stat label="テキストのみの投稿" value={fmtInt(data.postsTextOnly)} />
            <Stat label="画像付き投稿" value={fmtInt(data.postsWithImage)} />
            <Stat label="動画付き投稿" value={fmtInt(data.postsWithVideo)} />
          </div>
        </div>

        {/* コミュニティ・ソーシャル */}
        <div style={section}>
          <div style={sectionTitle}>コミュニティ・ソーシャルグラフ</div>
          <div style={grid(4)}>
            <Stat label="アクティブなコミュニティ（30日）" value={fmtInt(data.activeCommunitiesLast30Days)} />
            <Stat label="コミュニティ平均メンバー数" value={fmt(data.avgCommunityMembers)} />
            <Stat label="ユーザー平均参加コミュニティ数" value={fmt(data.avgCommunitiesPerUser)} />
            <Stat label="フォロー総数" value={fmtInt(data.totalFollows)} sub={`ユーザー平均: ${fmt(data.avgFollowersPerUser)}`} />
          </div>
          {communities.length > 0 && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600 }}>コミュニティ別アクティビティ（上位{communities.length}件）</span>
                <button
                  onClick={() => exportCommunitiesCsv(communities)}
                  style={{ padding: '0.25rem 0.75rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 500, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer' }}
                >↓ CSV</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem', color: '#64748b' }}>コミュニティ名</th>
                    <th style={{ padding: '0.5rem', color: '#64748b' }}>メンバー数</th>
                    <th style={{ padding: '0.5rem', color: '#64748b' }}>メッセージ数</th>
                  </tr>
                </thead>
                <tbody>
                  {communities.map((c) => (
                    <tr key={c.communityID} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem' }}>{c.name}</td>
                      <td style={{ padding: '0.5rem' }}>{fmtInt(c.memberCount)}</td>
                      <td style={{ padding: '0.5rem' }}>{fmtInt(c.messageCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* オンボーディング */}
        <div style={section}>
          <div style={sectionTitle}>オンボーディング</div>
          <div style={grid(4)}>
            <Stat label="プロフィール設定済み" value={fmtInt(data.usersWithProfile)} sub={`${fmt(data.usersWithProfile / data.totalUsers * 100)}%`} />
            <Stat label="アバター設定済み" value={fmtInt(data.usersWithAvatar)} sub={`${fmt(data.usersWithAvatar / data.totalUsers * 100)}%`} />
            <Stat label="初投稿済み" value={fmtInt(data.usersWithPost)} sub={`${fmt(data.usersWithPost / data.totalUsers * 100)}%`} />
            <Stat label="オンボーディング完了率" value={`${fmt(data.onboardingCompleteRate)}%`} />
            <Stat label="初投稿までの平均時間" value={data.avgTimeToFirstPostMinutes >= 60
              ? `${fmt(data.avgTimeToFirstPostMinutes / 60)}時間`
              : `${fmt(data.avgTimeToFirstPostMinutes)}分`} />
          </div>
        </div>

        {/* 通知 */}
        <div style={section}>
          <div style={sectionTitle}>通知</div>
          <div style={grid(4)}>
            <Stat label="通知総数" value={fmtInt(data.totalNotifications)} />
            <Stat label="開封済み" value={fmtInt(data.readNotifications)} />
            <Stat label="開封率" value={`${fmt(data.notificationReadRate)}%`} />
          </div>
        </div>

        {/* インフラ */}
        <div style={section}>
          <div style={sectionTitle}>インフラ・パフォーマンス</div>
          <div style={grid(4)}>
            <Stat label="WebSocket接続数" value={fmtInt(data.webSocketConnections)} />
            <Stat label="SSE接続数" value={fmtInt(data.sseConnections)} />
            <Stat label="エラーレート (5xx)" value={`${fmt(data.errorRate5xx)}%`} />
            <Stat label="APIレスポンス p50" value={`${fmt(data.p50ResponseTimeMs)}ms`} />
            <Stat label="APIレスポンス p95" value={`${fmt(data.p95ResponseTimeMs)}ms`} />
            <Stat label="APIレスポンス p99" value={`${fmt(data.p99ResponseTimeMs)}ms`} />
          </div>
        </div>
      </main>
    </>
  );
};
