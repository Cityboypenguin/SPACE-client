import React, { useEffect, useState } from 'react';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { Link } from 'react-router-dom';
import { 
  getReports, 
  adminUpdateReportStatus, 
  getReportServiceStatus,
  updateReportServiceStatus,
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
  const [reports, setReports] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<TargetTypeFilter>('ALL');
  const [error, setError] = useState('');
  const [isServiceEnabled, setIsServiceEnabled] = useState<boolean>(true);
  const [isStatusLoading, setIsStatusLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const loadReports = () => {
    setError('');
    getReports(filterStatus, activeTab === 'ALL' ? undefined : activeTab)
      .then((data) => {
        if (data && data.searchReports) {
          setReports(data.searchReports);
        } else {
          setReports([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('通報一覧の取得に失敗しました');
      });
  };

  const loadServiceStatus = async () => {
    setIsStatusLoading(true);
    try {
      const isEnabled = await getReportServiceStatus();
      setIsServiceEnabled(isEnabled);
    } catch (err) {
      console.error('システム設定の取得に失敗しました:', err);
    } finally {
      setIsStatusLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    loadServiceStatus();
  }, [filterStatus, activeTab]);

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
    } catch (err: any) {
      console.error(err);
      setError(`システム設定の更新に失敗しました: ${err.message || 'エラー'}`);
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
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: 700 }}>
            通報管理一覧
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: '#fff', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '8px', 
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              opacity: isStatusLoading ? 0.6 : 1
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: isServiceEnabled ? '#10b981' : '#ef4444',
                display: 'inline-block' 
              }} />
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>
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
                  backgroundColor: isServiceEnabled ? '#ef4444' : '#2563eb',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                {isUpdating ? '更新中...' : isServiceEnabled ? '一括停止' : 'サービス再開'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', padding: '0.4rem 0.8rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>ステータス絞り込み：</span>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">すべて</option>
                <option value="UNRESOLVED">未対応</option>
                <option value="REVIEWING">対応中</option>
                <option value="RESOLVED">対応済</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
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
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                  borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
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
          <p style={{ color: '#ef4444', background: '#fef2f2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem', fontWeight: 500 }}>
            {error}
          </p>
        )}

        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, fontSize: '0.8rem', width: '110px' }}>対象タイプ</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, fontSize: '0.8rem', width: '280px' }}>通報対象の内容</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, fontSize: '0.8rem', width: '140px' }}>通報理由</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, fontSize: '0.8rem', width: 'auto' }}>詳細説明</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, fontSize: '0.8rem', width: '130px', textAlign: 'center' }}>状態</th>
                <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, fontSize: '0.8rem', width: '110px' }}>日時</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const targetUrl = getTargetUrl(report.targetID, report.targetType);
                const currentStatus = report.status?.toUpperCase();
                return (
                  <tr key={report.ID} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}>
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

                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      <Link 
                        to={targetUrl} 
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        詳細を確認する
                      </Link>
                    </td>

                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      <span style={{ 
                        padding: '0.2rem 0.4rem', 
                        borderRadius: '4px', 
                        background: '#fee2e2', 
                        color: '#991b1b', 
                        fontWeight: 600, 
                        fontSize: '0.75rem',
                        display: 'inline-block',
                        wordBreak: 'break-all',
                        lineHeight: '1.2'
                      }}>
                        {report.reason}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', fontSize: '0.75rem', color: '#475569', wordBreak: 'break-all', lineHeight: '1.4' }}>
                      {report.customReason || <span style={{ color: '#cbd5e1' }}>(入力なし)</span>}
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
                          background: currentStatus === 'RESOLVED' ? '#dcfce7' : currentStatus === 'REVIEWING' ? '#fef9c3' : '#fee2e2',
                          color: currentStatus === 'RESOLVED' ? '#15803d' : currentStatus === 'REVIEWING' ? '#854d0e' : '#991b1b',
                        }}
                      >
                        <option value="UNRESOLVED">未対応</option>
                        <option value="REVIEWING">対応中</option>
                        <option value="RESOLVED">対応済</option>
                      </select>
                    </td>

                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle', color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {report.createdAt ? new Date(report.createdAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {reports.length === 0 && !error && (
          <div style={{ color: '#94a3b8', padding: '3rem', textAlign: 'center', fontSize: '0.85rem' }}>
            指定された条件の通報は見つかりませんでした
          </div>
        )}
      </main>
    </div>
  );
};