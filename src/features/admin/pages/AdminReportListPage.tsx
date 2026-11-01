import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { 
  getReports, 
  adminUpdateReportStatus, 
  getReportServiceStatus,
  updateReportServiceStatus,
  type Report,
} from '../api/report';
import styles from '../styles/AdminShared.module.css';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';

type TargetTypeFilter = 'ALL' | 'POST' | 'USER' | 'COMMUNITY';

const targetTypeJa: Record<string, string> = {
  POST: '投稿',
  USER: 'ユーザー',
  COMMUNITY: 'コミュニティ',
  COMMENT: 'コメント',
};

const statusJa: Record<string, string> = {
  PENDING: '未対応',
  UNRESOLVED: '未対応',
  REVIEWING: '対応中',
  RESOLVED: '対応済',
  DISMISSED: '却下（問題なし）',
};

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('reports');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<TargetTypeFilter>('ALL');
  const [error, setError] = useState('');
  const [isServiceEnabled, setIsServiceEnabled] = useState<boolean>(true);
  const [isStatusLoading, setIsStatusLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = useCallback((p: number, size = pageSize) => {
    setError('');
    getReports(filterStatus, activeTab === 'ALL' ? undefined : activeTab, size, p * size)
      .then((data) => {
        setReports(data.items ?? []);
        setTotal(data.total ?? 0);
        setPage(p);
      })
      .catch((err) => {
        console.error(err);
        setError('通報一覧の取得に失敗しました');
      });
  }, [activeTab, filterStatus, pageSize]);

  const loadReports = () => loadPage(0);

  const loadServiceStatus = useCallback(async () => {
    setIsStatusLoading(true);
    try {
      const isEnabled = await getReportServiceStatus();
      setIsServiceEnabled(isEnabled);
    } catch (err) {
      console.error('システム設定の取得に失敗しました:', err);
    } finally {
      setIsStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0));
  }, [loadPage]);

  useEffect(() => {
    void Promise.resolve().then(loadServiceStatus);
  }, [loadServiceStatus]);

  const handleToggleServiceStatus = async () => {
    const nextStatus = !isServiceEnabled;
    const actionText = nextStatus ? '稼働（再開）' : '停止';
    
    if (!window.confirm(`本当にシステム全体の通報機能を【${actionText}】しますか？\n停止すると一般ユーザーは通報を送信できなくなります。`)) {
      return;
    }

    setIsUpdating(true);
    setError('');
    try {
      const updatedStatus = await updateReportServiceStatus(nextStatus);
      setIsServiceEnabled(updatedStatus);
      alert('通報機能の設定を更新しました');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'エラー';
      console.error(err);
      setError(`システム設定の更新に失敗しました: ${message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string, statusLabel: string) => {
    if (!window.confirm(`ステータスを ${statusLabel} に変更しますか？`)) return;
    try {
      setError('');
      await adminUpdateReportStatus(reportId, newStatus);
      
      // サイドバーのバッジカウントを再計算させるイベントを発行
      window.dispatchEvent(new Event('report-status-updated'));
      
      loadReports();
    } catch (err) {
      console.error(err);
      setError('ステータスの更新に失敗しました');
    }
  };

  const getTargetUrl = (targetID: string, targetType: string) => {
    if (!targetID || targetID === '#') return '#';
    const type = targetType?.toUpperCase();
    
    if (type === 'POST') return `/admin/posts/${targetID}`;
    if (type === 'USER') return `/admin/users/${targetID}`;
    if (type === 'COMMUNITY') return `/admin/communities/${targetID}`;
    if (type === 'COMMENT') return `/admin/comments/${targetID}`;
    return '#';
  };
  
  const isProcessing = isStatusLoading || isUpdating;

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>
            通報管理
          </h1>
        </div>

        {/* ツールバー */}
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <label className={styles.label}>
                通報機能：
              </label>
              <button
                type="button"
                onClick={handleToggleServiceStatus}
                disabled={isProcessing}
                className={isServiceEnabled ? styles.paginationButton : styles.primaryButton}
                style={{ marginLeft: '8px' }}
              >
                {isUpdating ? '更新中...' : isServiceEnabled ? '一括停止' : 'サービス再開'}
              </button>
            </div>

            <div>
              <label className={styles.label}>
                ステータス絞り込み：
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={styles.select}
              >
                <option value="ALL">すべて</option>
                <option value="PENDING">未対応</option>
                <option value="REVIEWING">対応中</option>
                <option value="RESOLVED">対応済</option>
              </select>
            </div>
          </div>

          <div className={styles.toolbarGroup}>
            <span className={styles.countText}>全 {total} 件</span>
            <AdminPageSizeSelect value={pageSize} onChange={setPageSize} />
          </div>
        </div>

        {/* 対象タイプ切り替えタブ */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {(['ALL', 'POST', 'USER', 'COMMUNITY'] as TargetTypeFilter[]).map((tab) => {
            const isActive = activeTab === tab;
            const labelMap: Record<TargetTypeFilter, string> = {
              ALL: 'すべての通報',
              POST: '投稿',
              USER: 'ユーザー',
              COMMUNITY: 'コミュニティ',
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={isActive ? styles.primaryButton : styles.paginationButton}
              >
                {labelMap[tab]}
              </button>
            );
          })}
        </div>

        {error && <p className={styles.centerError}>{error}</p>}

        {/* テーブルパネル */}
        <div className={styles.tablePanelPlain}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableCellLarge}>対象タイプ</th>
                <th className={styles.tableCellLarge}>内容・詳細</th>
                <th className={styles.tableCellLarge}>通報理由</th>
                <th className={styles.tableCellLarge}>詳細説明</th>
                <th className={styles.tableCellLarge}>ステータス</th>
                <th className={styles.tableCellLarge}>日時</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const targetUrl = getTargetUrl(report.targetID, report.targetType);
                const currentStatus = report.status?.toUpperCase();

                return (
                  <tr key={report.ID} className={styles.tableRow}>
                    <td className={styles.tableCellLarge}>
                      {targetTypeJa[report.targetType?.toUpperCase()] || report.targetType}
                    </td>

                    <td className={styles.tableCellLarge}>
                      <Link to={targetUrl} style={{ color: '#2563eb', textDecoration: 'underline' }}>
                        詳細を確認する
                      </Link>
                      {report.targetType === 'POST' && report.content && (
                        <div className={styles.cellMuted} style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                          {report.content}
                        </div>
                      )}
                    </td>

                    <td className={styles.tableCellLarge}>{report.reason}</td>

                    <td className={styles.tableCellLarge}>
                      {report.customReason || <span className={styles.cellMuted}>(入力なし)</span>}
                    </td>

                    <td className={styles.tableCellLarge}>
                      <select
                        value={currentStatus === 'UNRESOLVED' ? 'PENDING' : currentStatus}
                        disabled={currentStatus === 'RESOLVED'}
                        onChange={(e) => {
                          const nextStatus = e.target.value;
                          const nextLabel = statusJa[nextStatus] || nextStatus;
                          handleUpdateStatus(report.ID, nextStatus, nextLabel);
                        }}
                        className={styles.select}
                        style={{ padding: '4px 8px' }}
                      >
                        <option value="PENDING">未対応</option>
                        <option value="REVIEWING">対応中</option>
                        <option value="RESOLVED">対応済</option>
                      </select>
                    </td>

                    <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleString('ja-JP', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {reports.length === 0 && !error && (
          <p className={styles.emptyState}>指定された条件の通報は見つかりませんでした</p>
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPrev={() => loadPage(page - 1)}
          onNext={() => loadPage(page + 1)}
        />
      </main>
    </div>
  );
};
