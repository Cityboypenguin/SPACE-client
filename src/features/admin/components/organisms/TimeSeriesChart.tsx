import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getTimeSeries } from '../../api/analytics';
import type { TimeSeriesGranularity, TimeSeriesPoint } from '../../api/analytics';
import { downloadCsv } from '../../lib/exportCsv';
import styles from './TimeSeriesChart.module.css';

const METRICS = [
  { key: 'posts',       label: '投稿',             color: '#3b82f6' },
  { key: 'comments',    label: 'コメント',         color: '#10b981' },
  { key: 'messages',    label: 'DM',               color: '#8b5cf6' },
  { key: 'newUsers',    label: '新規登録',         color: '#f59e0b' },
  { key: 'likes',       label: 'いいね',           color: '#ef4444' },
  { key: 'activeUsers', label: 'アクティブユーザー', color: '#06b6d4' },
] as const;

type MetricKey = typeof METRICS[number]['key'];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const PRESETS = [
  { label: '今日',    from: () => toDateStr(new Date()), to: () => toDateStr(new Date()) },
  { label: '昨日',    from: () => toDateStr(addDays(new Date(), -1)), to: () => toDateStr(addDays(new Date(), -1)) },
  { label: '過去7日', from: () => toDateStr(addDays(new Date(), -6)), to: () => toDateStr(new Date()) },
  { label: '過去30日', from: () => toDateStr(addDays(new Date(), -29)), to: () => toDateStr(new Date()) },
  { label: '過去90日', from: () => toDateStr(addDays(new Date(), -89)), to: () => toDateStr(new Date()) },
];

export const TimeSeriesChart = () => {
  const today = toDateStr(new Date());
  const [granularity, setGranularity] = useState<TimeSeriesGranularity>('day');
  const [from, setFrom] = useState(toDateStr(addDays(new Date(), -29)));
  const [to, setTo] = useState(today);
  const [data, setData] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState<Record<MetricKey, boolean>>({
    posts: true, comments: true, messages: true, newUsers: true, likes: true, activeUsers: true,
  });

  const load = useCallback(() => {
    if (!from || !to || from > to) return;
    setLoading(true);
    setError('');
    getTimeSeries(granularity, from, to)
      .then((pts) => { setData(pts); setError(''); })
      .catch((e: Error) => { setData([]); setError(e.message || 'データの取得に失敗しました'); })
      .finally(() => setLoading(false));
  }, [granularity, from, to]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setFrom(preset.from());
    setTo(preset.to());
  };

  const toggleMetric = (key: MetricKey) =>
    setVisible(v => ({ ...v, [key]: !v[key] }));

  const exportCsv = () => {
    const header = ['日時', '投稿', 'コメント', 'DM', '新規登録', 'いいね', 'アクティブユーザー'];
    const rows = data.map(d => [d.label, d.posts, d.comments, d.messages, d.newUsers, d.likes, d.activeUsers]);
    downloadCsv(`timeseries_${from}_${to}.csv`, [header, ...rows]);
  };

  // X軸ラベルを短縮（月-日 または 日-時）
  const tickFormatter = (label: string) =>
    granularity === 'hour' ? label.slice(5).replace(' ', ' ') : label.slice(5);

  // データ点数が多い場合はX軸ラベルを間引く
  const xInterval = data.length > 60 ? Math.ceil(data.length / 30) - 1 : data.length > 20 ? 1 : 0;

  return (
    <div className={styles.card}>
      {/* タイトル */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          アクティビティ推移
        </h3>
        <button
          onClick={exportCsv}
          disabled={data.length === 0}
          className={styles.csvButton}
        >
          ↓ CSV
        </button>
      </div>

      {/* コントロール行 */}
      <div className={styles.controls}>

        {/* 粒度切替 */}
        <div className={styles.buttonGroup}>
          <button className={styles.toggleButton} data-active={granularity === 'day'} onClick={() => setGranularity('day')}>日別</button>
          <button className={styles.toggleButton} data-active={granularity === 'hour'} onClick={() => setGranularity('hour')}>時間別</button>
        </div>

        {/* プリセット */}
        <div className={styles.buttonGroup}>
          {PRESETS.map(p => (
            <button
              key={p.label}
              className={styles.toggleButton}
              data-active={from === p.from() && to === p.to()}
              onClick={() => applyPreset(p)}
            >{p.label}</button>
          ))}
        </div>

        {/* 日付ピッカー */}
        <div className={styles.dateRange}>
          <input
            type="date"
            value={from}
            max={to}
            onChange={e => setFrom(e.target.value)}
            className={styles.dateInput}
          />
          <span className={styles.rangeSeparator}>〜</span>
          <input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={e => setTo(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        {/* メトリクス切替 */}
        <div className={styles.buttonGroup}>
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className={styles.toggleButton}
              data-active={visible[m.key]}
              data-metric={m.key}
            >{m.label}</button>
          ))}
        </div>
      </div>

      {/* グラフ本体 */}
      {from > to ? (
        <div className={styles.chartError}>
          開始日が終了日より後になっています
        </div>
      ) : loading ? (
        <div className={styles.chartMessage}>
          読み込み中…
        </div>
      ) : error ? (
        <div className={styles.chartErrorPanel}>
          <div className={styles.errorText}>取得エラー: {error}</div>
          <button onClick={load} className={styles.retryButton}>
            再読み込み
          </button>
        </div>
      ) : data.length === 0 ? (
        <div className={styles.chartMessage}>
          この期間にデータがありません
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              tickFormatter={tickFormatter}
              interval={xInterval}
            />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} width={36} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', fontSize: '0.85rem' }}
              labelStyle={{ fontWeight: 600, color: 'var(--color-text)' }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                METRICS.find(m => m.key === name)?.label ?? name,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '0.82rem', paddingTop: '0.5rem' }}
              formatter={(value) => METRICS.find(m => m.key === value)?.label ?? value}
            />
            {METRICS.map(m => visible[m.key] && (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={2}
                dot={data.length <= 48 ? { r: 3, fill: m.color } : false}
                activeDot={{ r: 5 }}
                name={m.key}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
