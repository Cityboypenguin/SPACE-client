import React, { useCallback, useEffect, useState } from 'react';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { Link } from 'react-router-dom';
import { 
  getReports, 
  adminUpdateReportStatus, 
  getReportServiceStatus,
  updateReportServiceStatus,
  type Report,
} from '../api/report';
import styles from './AdminPageStyles.module.css';

type TargetTypeFilter = 'ALL' | 'POST' | 'USER' | 'COMMUNITY';

const targetTypeJa: Record<string, string> = {
  POST: '投稿',
  USER: 'ユーザー',
  COMMUNITY: 'コミュニティ',
  COMMENT: 'コメント',
};

const statusJa: Record<string, string> = {
  UNRESOLVED: '未対応',
  PENDING: '未対応',
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
      <main className={styles.pageWide}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>
              通報管理一覧
            </h1>
            <span className={styles.countText}>全 {total} 件</span>
          </div>
          
          <div className={styles.toolbarGroup}>
            <div className={`${styles.serviceStatus} ${isStatusLoading ? styles.serviceStatusLoading : ''}`}>
              <span className={`${styles.statusDot} ${isServiceEnabled ? styles.statusDotEnabled : styles.statusDotDisabled}`} />
              <span className={styles.controlLabel}>
                システム通報枠: {isStatusLoading ? '読み込み中...' : isServiceEnabled ? '稼働中' : '停止中'}
              </span>
              <button
                onClick={handleToggleServiceStatus}
                disabled={isProcessing}
                className={`${styles.serviceButton} ${isServiceEnabled ? styles.serviceButtonStop : styles.serviceButtonStart} ${isProcessing ? styles.disabled : ''}`}
              >
                {isUpdating ? '更新中...' : isServiceEnabled ? '一括停止' : 'サービス再開'}
              </button>
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>ステータス絞り込み：</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={styles.selectSmall}
              >
                <option value="ALL">すべて</option>
                <option value="UNRESOLVED">未対応</option>
                <option value="REVIEWING">対応中</option>
                <option value="RESOLVED">対応済</option>
              </select>
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>表示件数：</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={styles.selectSmall}
              >
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}件</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.tabBar}>
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
                onClick={() => setActiveTab(tab)}
                className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
              >
                {labelMap[tab]}
              </button>
            );
          })}
        </div>

        {error && (
          <p className={styles.alertError}>
            {error}
          </p>
        )}

        <div className={styles.tablePanel}>
          <table className={styles.fixedTable}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={`${styles.reportHeader} ${styles.reportTargetColumn}`}>対象タイプ</th>
                <th className={`${styles.reportHeader} ${styles.reportContentColumn}`}>通報対象の内容</th>
                <th className={`${styles.reportHeader} ${styles.reportReasonColumn}`}>通報理由</th>
                <th className={styles.reportHeader}>詳細説明</th>
                <th className={`${styles.reportHeader} ${styles.reportStatusColumn} ${styles.cellCenter}`}>状態</th>
                <th className={`${styles.reportHeader} ${styles.reportDateColumn}`}>日時</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const targetUrl = getTargetUrl(report.targetID, report.targetType);
                const currentStatus = report.status?.toUpperCase();
                return (
                  <tr key={report.ID} className={styles.hoverRow}>
                    <td className={styles.reportCell}>
                      <span className={styles.targetBadge} data-type={report.targetType}>
                        {targetTypeJa[report.targetType?.toUpperCase()] || report.targetType}
                      </span>
                    </td>

                    <td className={`${styles.reportCell} ${styles.cellTop}`}>
                      <Link 
                      to={targetUrl} 
                      className={`${styles.targetLink} ${report.targetType === 'POST' && report.content ? styles.targetLinkWithContent : ''}`}
                      >
                      詳細を確認する
                      </Link>
                      
                      {report.targetType === 'POST' && report.content && (
                        <div className={styles.contentPreview}>
                        <span className={styles.contentPreviewLabel}>
                          通報時の投稿本文:
                        </span>
                          {report.content}
                        </div>
                      )}
                    </td>

                    <td className={styles.reportCell}>
                      <span className={styles.reasonBadge}>
                        {report.reason}
                      </span>
                    </td>

                    <td className={`${styles.reportCell} ${styles.reportCustomReason}`}>
                      {report.customReason || <span className={styles.cellMuted}>(入力なし)</span>}
                    </td>

                    <td className={`${styles.reportCell} ${styles.cellCenter}`}>
                      <select
                        value={currentStatus === 'PENDING' ? 'UNRESOLVED' : currentStatus}
                        disabled={currentStatus === 'RESOLVED'}
                        data-status={currentStatus}
                        onChange={(e) => {
                          const nextStatus = e.target.value;
                          const nextLabel = statusJa[nextStatus] || nextStatus;
                          handleUpdateStatus(report.ID, nextStatus, nextLabel);
                        }}
                        className={styles.statusSelect}
                      >
                        <option value="UNRESOLVED">未対応</option>
                        <option value="REVIEWING">対応中</option>
                        <option value="RESOLVED">対応済</option>
                      </select>
                    </td>

                    <td className={`${styles.reportCell} ${styles.reportDateCell}`}>
                      {report.createdAt ? new Date(report.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {reports.length === 0 && !error && (
          <div className={styles.emptyStateLarge}>
            指定された条件の通報は見つかりませんでした
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => loadPage(page - 1)}
              disabled={page === 0}
              className={styles.paginationButton}
            >
              前へ
            </button>
            <span className={styles.cellText}>{page + 1} / {totalPages}</span>
            <button
              onClick={() => loadPage(page + 1)}
              disabled={page >= totalPages - 1}
              className={styles.paginationButton}
            >
              次へ
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
