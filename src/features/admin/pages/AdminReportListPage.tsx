import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { SEARCH_REPORTS_QUERY, UPDATE_REPORT_STATUS_MUTATION } from '../api/report';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchReports = async () => {
    setLoading(true);
    try {
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  return (
    <>
      <AdminHeader />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
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
            style={{ padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}
          >
            <option value="ALL">すべて</option>
            <option value="PENDING">未対応</option>
            <option value="RESOLVED">対応済</option>
          </select>
        </div>
      </div>
    </>
  );
};