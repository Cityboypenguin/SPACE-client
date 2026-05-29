import React, { useEffect, useState } from 'react';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getReports, adminUpdateReportStatus } from '../api/report';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [error, setError] = useState('');

  const loadReports = () => {
    setError('');
    getReports(filterStatus)
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

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    if (!window.confirm(`ステータスを ${newStatus} に変更しますか？`)) return;
    try {
      setError('');
      await adminUpdateReportStatus(reportId, newStatus);
      loadReports();
    } catch (err) {
      console.error(err);
      setError('ステータスの更新に失敗しました');
    }
  };

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, color: '#1e293b' }}>
            🚩 通報管理一覧
          </h1>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 500, marginRight: '0.5rem', color: '#475569' }}>
            ステータス絞り込み：
          </label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
          >
            <option value="ALL">すべて</option>
            <option value="PENDING">未対応</option>
            <option value="RESOLVED">対応済</option>
          </select>
        </div>

        {error && <p style={{ color: 'red', textAlign: 'center', padding: '1rem' }}>{error}</p>}

        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem' }}>対象タイプ</th>
                <th style={{ padding: '1rem' }}>通報理由</th>
                <th style={{ padding: '1rem' }}>詳細説明</th>
                <th style={{ padding: '1rem' }}>ステータス</th>
                <th style={{ padding: '1rem' }}>日時</th>
                <th style={{ padding: '1rem' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: 4, background: '#f1f5f9', fontSize: '0.85rem', fontWeight: 600 }}>
                      {report.targetType}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{report.reason}</td>
                  <td style={{ padding: '1rem', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {report.customReason || '（理由の入力なし）'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.6rem', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600,
                      background: report.status === 'RESOLVED' ? '#dcfce7' : '#fef9c3',
                      color: report.status === 'RESOLVED' ? '#15803d' : '#a16207'
                    }}>
                      {report.status === 'RESOLVED' ? '対応済' : '未対応'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    {report.createdAt ? new Date(report.createdAt).toLocaleString('ja-JP') : '---'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {report.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateStatus(report.ID, 'RESOLVED')}
                        style={{ padding: '0.4rem 0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        対応完了にする
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reports.length === 0 && !error && (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>通報が見つかりませんでした</p>
        )}
      </main>
    </div>
  );
};