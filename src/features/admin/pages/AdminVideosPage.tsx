import { useCallback, useEffect, useState } from 'react';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { ADMIN_TOKEN_KEY } from '../api/auth';
import {
  getVideoStats,
  previewVideoRetention,
  updateVideoLimits,
  updateVideoRetention,
  type AdminVideoStats,
  type RetentionPreview,
  type VideoLimitsInput,
} from '../api/videos';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from '../styles/AdminShared.module.css';

const formatBytes = (bytes: number) => {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`;
  return `${bytes} B`;
};

const limitText = (v: number, unit: (n: number) => string) => (v === 0 ? '無制限' : unit(v));

// 管理画面の「動画」。量の把握・保存期間の変更（影響の確認つき）・上限の設定。
export const AdminVideosPage = () => {
  const [stats, setStats] = useState<AdminVideoStats | null>(null);
  const [error, setError] = useState('');
  const [days, setDays] = useState('');
  const [preview, setPreview] = useState<RetentionPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [limits, setLimits] = useState<VideoLimitsInput | null>(null);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? '';

  const applyStats = useCallback((s: AdminVideoStats) => {
    setStats(s);
    setDays(String(s.settings.retentionDays));
    setLimits({
      purgeGraceDays: s.settings.purgeGraceDays,
      purgeBatchSize: s.settings.purgeBatchSize,
      dailyUploadLimitPerUser: s.settings.dailyUploadLimitPerUser,
      dailyBytesLimitPerUser: s.settings.dailyBytesLimitPerUser,
      totalBytesLimit: s.settings.totalBytesLimit,
    });
  }, []);

  useEffect(() => {
    getVideoStats(token)
      .then(applyStats)
      .catch((err) => setError(toUserMessage(err, '動画の情報を取得できませんでした。')));
  }, [token, applyStats]);

  const load = async () => applyStats(await getVideoStats(token));

  const handlePreview = async () => {
    setError('');
    setMessage('');
    setPreview(null);
    const n = Number(days);
    if (!Number.isInteger(n) || n < 1) {
      setError('保存期間は1以上の整数で入力してください。');
      return;
    }
    setBusy(true);
    try {
      setPreview(await previewVideoRetention(n, token));
    } catch (err) {
      setError(toUserMessage(err, err instanceof Error ? err.message : '影響を確認できませんでした。'));
    } finally {
      setBusy(false);
    }
  };

  const handleApplyRetention = async () => {
    if (!preview) return;
    setBusy(true);
    setError('');
    try {
      await updateVideoRetention(preview.newDays, preview.newlyExpired.count, token);
      setMessage(`保存期間を${preview.newDays}日に変更しました。`);
      setPreview(null);
      await load();
    } catch (err) {
      setError(toUserMessage(err, err instanceof Error ? err.message : '保存期間を変更できませんでした。'));
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveLimits = async () => {
    if (!limits) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await updateVideoLimits(limits, token);
      setMessage('設定を保存しました。');
      await load();
    } catch (err) {
      setError(toUserMessage(err, err instanceof Error ? err.message : '設定を保存できませんでした。'));
    } finally {
      setBusy(false);
    }
  };

  const setLimit = (key: keyof VideoLimitsInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLimits((prev) => (prev ? { ...prev, [key]: Number.isFinite(v) ? v : 0 } : prev));
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered} style={{ maxWidth: '960px' }}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>動画</h1>
        </div>
        {error && <p className={styles.formError} role="alert">{error}</p>}
        {message && <p className={styles.successText} role="status">{message}</p>}

        {!stats ? (
          !error && <p className={styles.cellMuted}>読み込み中...</p>
        ) : (
          <>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>保存の状況</h2>
              <table className={styles.infoTable}>
                <tbody>
                  <tr><th>保存中の動画</th><td>{stats.stored.count.toLocaleString()} 本 / {formatBytes(stats.stored.bytes)}</td></tr>
                  <tr><th>今日の投稿</th><td>{stats.today.uploads.toLocaleString()} 本 / {formatBytes(stats.today.uploadBytes)}</td></tr>
                  <tr><th>今月のアップロード</th><td>{stats.thisMonth.uploads.toLocaleString()} 本 / {formatBytes(stats.thisMonth.uploadBytes)}</td></tr>
                  <tr><th>今月のアップロード失敗（検査で拒否）</th><td>{stats.thisMonth.uploadFailures.toLocaleString()} 件</td></tr>
                  <tr>
                    <th>今月のダウンロード（目安）</th>
                    <td>
                      {stats.thisMonth.playbackRequests.toLocaleString()} 回 / 最大 {formatBytes(stats.thisMonth.playbackBytes)}
                      <div className={styles.helpText}>再生URLを出した回数×動画の大きさ。実際の転送量は Azure Monitor のストレージアカウントの「Egress」で確認してください。</div>
                    </td>
                  </tr>
                  <tr><th>今月の自動削除</th><td>{stats.thisMonth.purged.toLocaleString()} 本（失敗 {stats.thisMonth.purgeFailures.toLocaleString()} 件）</td></tr>
                  <tr>
                    <th>削除のやり直し待ち</th>
                    <td className={stats.purgeFailing > 0 ? styles.errorText : undefined}>{stats.purgeFailing.toLocaleString()} 本</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>保存期間</h2>
              <p className={styles.helpText}>
                現在は投稿から <strong>{stats.settings.retentionDays}日</strong>。
                期限が来た動画はすぐに再生できなくなり、{stats.settings.purgeGraceDays}日後にファイルが削除されます。
                変更はまだ削除していない既存の動画にも適用されます。
                設定できる上限は {stats.settings.maxRetentionDays}日です
                {stats.settings.lifecycleBackstopDays > 0 && `（Azure の自動削除 ${stats.settings.lifecycleBackstopDays}日より手前）`}。
              </p>
              <div className={styles.inlineRow}>
                <input
                  type="number"
                  min={1}
                  max={stats.settings.maxRetentionDays}
                  value={days}
                  onChange={(e) => { setDays(e.target.value); setPreview(null); }}
                  className={styles.inputCompact}
                  aria-label="新しい保存期間（日）"
                />
                <span>日</span>
                <button type="button" className={styles.outlinePrimaryButton} onClick={handlePreview} disabled={busy}>
                  影響を確認
                </button>
              </div>
              {preview && (
                <div className={styles.confirmDialog} style={{ position: 'static', marginTop: 12 }}>
                  <p className={styles.confirmText}>
                    {preview.currentDays}日 → <strong>{preview.newDays}日</strong> に変更すると:
                  </p>
                  <ul>
                    <li className={preview.newlyExpired.count > 0 ? styles.errorText : undefined}>
                      すぐに再生できなくなる動画: {preview.newlyExpired.count.toLocaleString()} 本（{formatBytes(preview.newlyExpired.bytes)}）
                    </li>
                    <li>7日以内に期限が来る動画: {preview.expiringWithinWeek.count.toLocaleString()} 本（{formatBytes(preview.expiringWithinWeek.bytes)}）</li>
                  </ul>
                  <div className={styles.confirmActions}>
                    <button type="button" className={styles.ghostButton} onClick={() => setPreview(null)} disabled={busy}>やめる</button>
                    <button
                      type="button"
                      className={preview.newlyExpired.count > 0 ? styles.dangerFillButton : styles.primaryButton}
                      onClick={handleApplyRetention}
                      disabled={busy}
                    >
                      この内容で変更する
                    </button>
                  </div>
                </div>
              )}
            </section>

            {limits && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>上限と削除の設定</h2>
                <p className={styles.helpText}>0 は無制限です。容量はバイトで入力します（25MB = 25000000）。</p>
                <table className={styles.infoTable}>
                  <tbody>
                    <tr>
                      <th>期限後にファイルを消すまでの猶予（日）</th>
                      <td><input type="number" min={0} value={limits.purgeGraceDays} onChange={setLimit('purgeGraceDays')} className={styles.inputCompact} /></td>
                    </tr>
                    <tr>
                      <th>1回の自動削除で消す本数</th>
                      <td><input type="number" min={1} value={limits.purgeBatchSize} onChange={setLimit('purgeBatchSize')} className={styles.inputCompact} /></td>
                    </tr>
                    <tr>
                      <th>1人1日の投稿本数（現在: {limitText(stats.settings.dailyUploadLimitPerUser, (n) => `${n}本`)}）</th>
                      <td><input type="number" min={0} value={limits.dailyUploadLimitPerUser} onChange={setLimit('dailyUploadLimitPerUser')} className={styles.inputCompact} /></td>
                    </tr>
                    <tr>
                      <th>1人1日の投稿容量（現在: {limitText(stats.settings.dailyBytesLimitPerUser, formatBytes)}）</th>
                      <td><input type="number" min={0} value={limits.dailyBytesLimitPerUser} onChange={setLimit('dailyBytesLimitPerUser')} className={styles.inputCompact} /></td>
                    </tr>
                    <tr>
                      <th>動画全体の保存容量（現在: {limitText(stats.settings.totalBytesLimit, formatBytes)}）</th>
                      <td><input type="number" min={0} value={limits.totalBytesLimit} onChange={setLimit('totalBytesLimit')} className={styles.inputCompact} /></td>
                    </tr>
                  </tbody>
                </table>
                <div className={styles.buttonRow}>
                  <button type="button" className={styles.primaryButton} onClick={handleSaveLimits} disabled={busy}>保存</button>
                </div>
              </section>
            )}

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>日ごとの集計</h2>
              <table className={styles.compactTable}>
                <thead>
                  <tr>
                    <th className={styles.compactTableHeader}>日付</th>
                    <th className={styles.compactTableHeader}>投稿</th>
                    <th className={styles.compactTableHeader}>アップロード</th>
                    <th className={styles.compactTableHeader}>拒否</th>
                    <th className={styles.compactTableHeader}>再生</th>
                    <th className={styles.compactTableHeader}>削除</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.daily].reverse().map((d) => (
                    <tr key={d.day}>
                      <td className={styles.compactTableCell}>{d.day}</td>
                      <td className={styles.compactTableCell}>{d.uploads}</td>
                      <td className={styles.compactTableCell}>{formatBytes(d.uploadBytes)}</td>
                      <td className={styles.compactTableCell}>{d.uploadFailures}</td>
                      <td className={styles.compactTableCell}>{d.playbackRequests}</td>
                      <td className={styles.compactTableCell}>{d.purged}{d.purgeFailures > 0 ? `（失敗 ${d.purgeFailures}）` : ''}</td>
                    </tr>
                  ))}
                  {stats.daily.length === 0 && (
                    <tr><td className={styles.compactTableCell} colSpan={6}>まだ記録がありません。</td></tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
