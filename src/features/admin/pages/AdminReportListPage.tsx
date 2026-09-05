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
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', backgroundColor: 'var(--color-surface)', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--color-text)', fontWeight: 700 }}>
              通報管理一覧
            </h1>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>全 {total} 件</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: 'var(--color-bg-elevated)', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '8px', 
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              border: '1px solid var(--color-border)',
              opacity: isStatusLoading ? 0.6 : 1
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: isServiceEnabled ? 'var(--color-success)' : 'var(--color-danger)',
                display: 'inline-block' 
              }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                システム通報枠: {isStatusLoading ? '読み込み中...' : isServiceEnabled ? '稼働中' : '停止中'}
              </span>
              <button
                onClick={handleToggleServiceStatus}
                disabled={isProcessing}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  color: '#fff',
                  backgroundColor: isServiceEnabled ? 'var(--color-danger)' : 'var(--color-primary-hover)',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                {isUpdating ? '更新中...' : isServiceEnabled ? '一括停止' : 'サービス再開'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-bg-elevated)', padding: '0.4rem 0.8rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', fontWeight: 600 }}>ステータス絞り込み：</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">すべて</option>
                <option value="UNRESOLVED">未対応</option>
                <option value="REVIEWING">対応中</option>
                <option value="RESOLVED">対応済</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-bg-elevated)', padding: '0.4rem 0.8rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', fontWeight: 600 }}>表示件数：</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
              >
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}件</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
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
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '6px 6px 0 0',
                  border: 'none',
                  background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--color-primary-hover)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  borderBottom: isActive ? '2px solid var(--color-primary-hover)' : '2px solid transparent',
                  transition: 'all 0.15s',
                  marginBottom: '-1px',
                }}
              >
                {labelMap[tab]}
              </button>
            );
          })}
        </div>

        {error && (
          <p style={{ color: 'var(--color-danger)', background: 'var(--color-danger-bg)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem', fontWeight: 500 }}>
            {error}
          </p>
        )}

        <div style={{ background: 'var(--color-bg-elevated)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto', border: '1px solid var(--color-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text)', fontWeight: 600, fontSize: '0.8rem', width: '110px' }}>対象タイプ</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text)', fontWeight: 600, fontSize: '0.8rem', width: '280px' }}>通報対象の内容</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text)', fontWeight: 600, fontSize: '0.8rem', width: '140px' }}>通報理由</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text)', fontWeight: 600, fontSize: '0.8rem', width: 'auto' }}>詳細説明</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text)', fontWeight: 600, fontSize: '0.8rem', width: '130px', textAlign: 'center' }}>状態</th>
                <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text)', fontWeight: 600, fontSize: '0.8rem', width: '110px' }}>日時</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const targetUrl = getTargetUrl(report.targetID, report.targetType);
                const currentStatus = report.status?.toUpperCase();
                return (
                  <tr key={report.ID} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)'}>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        background: report.targetType === 'USER' ? '#eff6ff' : report.targetType === 'COMMUNITY' ? '#f5f3ff' : '#f0fdf4',
                        color: report.targetType === 'USER' ? '#1d4ed8' : report.targetType === 'COMMUNITY' ? '#6d28d9' : '#15803d',
                        border: `1px solid ${report.targetType === 'USER' ? '#bfdbfe' : report.targetType === 'COMMUNITY' ? '#ddd6fe' : '#bbf7d0'}`
                      }}>
                        {targetTypeJa[report.targetType?.toUpperCase()] || report.targetType}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                      <Link 
                      to={targetUrl} 
                      style={{ 
                        color: 'var(--color-link)', 
                        textDecoration: 'none', 
                        fontWeight: 600, 
                        fontSize: '0.85rem',
                        display: 'block',
                        marginBottom: report.targetType === 'POST' && report.content ? '0.5rem' : '0'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                      詳細を確認する
                      </Link>
                      
                      {report.targetType === 'POST' && report.content && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text)',
                          background: 'var(--color-surface)',
                          padding: '0.5rem 0.7rem',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                          wordBreak: 'break-all',
                          maxHeight: '4.5rem',
                          overflowY: 'auto',
                          lineHeight: '1.4',
                          textAlign: 'left',
                          marginTop: '0.25rem'
                      }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.7rem', display: 'block', marginBottom: '0.2rem' }}>
                          通報時の投稿本文:
                        </span>
                          {report.content}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      <span style={{ 
                        padding: '0.2rem 0.4rem', 
                        borderRadius: '4px', 
                        background: 'var(--color-danger-bg)', 
                        color: 'var(--color-danger)', 
                        fontWeight: 600, 
                        fontSize: '0.75rem',
                        display: 'inline-block',
                        wordBreak: 'break-all',
                        lineHeight: '1.2'
                      }}>
                        {report.reason}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', fontSize: '0.75rem', color: 'var(--color-text)', wordBreak: 'break-all', lineHeight: '1.4' }}>
                      {report.customReason || <span style={{ color: 'var(--color-text-muted)' }}>(入力なし)</span>}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                      <select
                        value={currentStatus === 'PENDING' ? 'UNRESOLVED' : currentStatus}
                        disabled={currentStatus === 'RESOLVED'}
                        onChange={(e) => {
                          const nextStatus = e.target.value;
                          const nextLabel = statusJa[nextStatus] || nextStatus;
                          handleUpdateStatus(report.ID, nextStatus, nextLabel);
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: currentStatus === 'RESOLVED' ? 'default' : 'pointer',
                          outline: 'none',
                          border: 'none',
                          textAlign: 'center',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          appearance: 'none',
                          background: currentStatus === 'RESOLVED' ? 'var(--color-success-bg)' : currentStatus === 'REVIEWING' ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)',
                          color: currentStatus === 'RESOLVED' ? 'var(--color-success)' : currentStatus === 'REVIEWING' ? 'var(--color-warning)' : 'var(--color-danger)',
                        }}
                      >
                        <option value="UNRESOLVED">未対応</option>
                        <option value="REVIEWING">対応中</option>
                        <option value="RESOLVED">対応済</option>
                      </select>
                    </td>

                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', color: 'var(--color-text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {report.createdAt ? new Date(report.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {reports.length === 0 && !error && (
          <div style={{ color: 'var(--color-text-muted)', padding: '3rem', textAlign: 'center', fontSize: '0.85rem' }}>
            指定された条件の通報は見つかりませんでした
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={() => loadPage(page - 1)}
              disabled={page === 0}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid var(--color-border)', cursor: page === 0 ? 'not-allowed' : 'pointer', background: 'var(--color-bg-elevated)' }}
            >
              前へ
            </button>
            <span style={{ color: 'var(--color-text)' }}>{page + 1} / {totalPages}</span>
            <button
              onClick={() => loadPage(page + 1)}
              disabled={page >= totalPages - 1}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid var(--color-border)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', background: 'var(--color-bg-elevated)' }}
            >
              次へ
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
