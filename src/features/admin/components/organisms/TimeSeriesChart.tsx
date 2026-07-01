import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getTimeSeries } from '../../api/analytics';
import type { TimeSeriesGranularity, TimeSeriesPoint } from '../../api/analytics';

const METRICS = [
  { key: 'posts',    label: '投稿',     color: '#3b82f6' },
  { key: 'comments', label: 'コメント', color: '#10b981' },
  { key: 'messages', label: 'DM',       color: '#8b5cf6' },
  { key: 'newUsers', label: '新規登録', color: '#f59e0b' },
  { key: 'likes',    label: 'いいね',   color: '#ef4444' },
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
  const [visible, setVisible] = useState<Record<MetricKey, boolean>>({
    posts: true, comments: true, messages: true, newUsers: true, likes: true,
  });

  const load = useCallback(() => {
    if (!from || !to || from > to) return;
    setLoading(true);
    getTimeSeries(granularity, from, to)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [granularity, from, to]);

  useEffect(() => { load(); }, [load]);

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setFrom(preset.from());
    setTo(preset.to());
  };

  const toggleMetric = (key: MetricKey) =>
    setVisible(v => ({ ...v, [key]: !v[key] }));

  // ボタンスタイル
  const btn = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '0.35rem 0.8rem', borderRadius: 6, cursor: 'pointer',
    fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.15s',
    border: `1px solid ${active ? (color ?? '#0f172a') : '#e2e8f0'}`,
    background: active ? (color ?? '#0f172a') : '#fff',
    color: active ? '#fff' : '#64748b',
  });

  const inputStyle: React.CSSProperties = {
    padding: '0.35rem 0.6rem', borderRadius: 6, border: '1px solid #cbd5e1',
    fontSize: '0.85rem', color: '#0f172a', background: '#fff', cursor: 'pointer',
  };

  // X軸ラベルを短縮（月-日 または 日-時）
  const tickFormatter = (label: string) =>
    granularity === 'hour' ? label.slice(5).replace(' ', ' ') : label.slice(5);

  // データ点数が多い場合はX軸ラベルを間引く
  const xInterval = data.length > 60 ? Math.ceil(data.length / 30) - 1 : data.length > 20 ? 1 : 0;

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      {/* タイトル */}
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
        アクティビティ推移
      </h3>

      {/* コントロール行 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>

        {/* 粒度切替 */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button style={btn(granularity === 'day')}  onClick={() => setGranularity('day')}>日別</button>
          <button style={btn(granularity === 'hour')} onClick={() => setGranularity('hour')}>時間別</button>
        </div>

        {/* プリセット */}
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <button
              key={p.label}
              style={btn(from === p.from() && to === p.to())}
              onClick={() => applyPreset(p)}
            >{p.label}</button>
          ))}
        </div>

        {/* 日付ピッカー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="date"
            value={from}
            max={to}
            onChange={e => setFrom(e.target.value)}
            style={inputStyle}
          />
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>〜</span>
          <input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={e => setTo(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* メトリクス切替 */}
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              style={btn(visible[m.key], m.color)}
            >{m.label}</button>
          ))}
        </div>
      </div>

      {/* グラフ本体 */}
      {from > to ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
          開始日が終了日より後になっています
        </div>
      ) : loading ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          読み込み中…
        </div>
      ) : data.length === 0 ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          この期間にデータがありません
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={tickFormatter}
              interval={xInterval}
            />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={36} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
              labelStyle={{ fontWeight: 600, color: '#0f172a' }}
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
