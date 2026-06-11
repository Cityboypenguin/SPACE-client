import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getInquiries, updateInquiryStatus } from '../api/inquiry';

type Inquiry = {
  id: string;
  name: string;
  email: string;
  subject: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: '未対応',
  IN_PROGRESS: '対応中',
  RESOLVED: '対応済',
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#fef9c3', color: '#a16207' },
  IN_PROGRESS: { bg: '#dbeafe', color: '#1d4ed8' },
  RESOLVED: { bg: '#dcfce7', color: '#15803d' },
};

const PAGE_SIZE = 20;

export const AdminInquiryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [error, setError] = useState('');

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const loadPage = (p: number, status: string) => {
    setError('');
    getInquiries(status, PAGE_SIZE, p * PAGE_SIZE)
      .then((data) => {
        setInquiries(data.items);
        setTotal(data.total);
        setPage(p);
      })
      .catch((err) => {
        console.error(err);
        setError('問い合わせ一覧の取得に失敗しました');
      });
  };

  useEffect(() => {
    loadPage(0, filterStatus);
  }, [filterStatus]);

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!window.confirm(`ステータスを「${STATUS_LABEL[newStatus]}」に変更しますか？`)) return;
    try {
      setError('');
      await updateInquiryStatus(id, newStatus);
      loadPage(page, filterStatus);
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
            問い合わせ管理
          </h1>
        </div>

        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <label style={{ fontWeight: 500, marginRight: '0.5rem', color: '#475569' }}>
              ステータス絞り込み：
            </label>
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
            >
              <option value="ALL">すべて</option>
              <option value="PENDING">未対応</option>
              <option value="IN_PROGRESS">対応中</option>
              <option value="RESOLVED">対応済</option>
            </select>
          </div>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>全 {total} 件</span>
        </div>

        {error && <p style={{ color: 'red', textAlign: 'center', padding: '1rem' }}>{error}</p>}

        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem' }}>件名</th>
                <th style={{ padding: '1rem' }}>氏名</th>
                <th style={{ padding: '1rem' }}>メールアドレス</th>
                <th style={{ padding: '1rem' }}>ステータス</th>
                <th style={{ padding: '1rem' }}>受信日時</th>
                <th style={{ padding: '1rem' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => {
                const sc = STATUS_COLOR[inquiry.status] ?? { bg: '#f1f5f9', color: '#475569' };
                return (
                  <tr key={inquiry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => navigate(`/admin/inquiries/${inquiry.id}`)}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          color: '#2563eb', cursor: 'pointer', fontWeight: 500,
                          fontSize: '0.95rem', textDecoration: 'underline', textAlign: 'left',
                        }}
                      >
                        {inquiry.subject}
                      </button>
                    </td>
                    <td style={{ padding: '1rem' }}>{inquiry.name}</td>
                    <td style={{ padding: '1rem', color: '#475569' }}>{inquiry.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600,
                        background: sc.bg, color: sc.color,
                      }}>
                        {STATUS_LABEL[inquiry.status] ?? inquiry.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                      {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString('ja-JP') : '---'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {inquiry.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateStatus(inquiry.id, 'IN_PROGRESS')}
                            style={{ padding: '0.35rem 0.7rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                          >
                            対応中にする
                          </button>
                        )}
                        {inquiry.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleUpdateStatus(inquiry.id, 'RESOLVED')}
                            style={{ padding: '0.35rem 0.7rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                          >
                            対応済にする
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {inquiries.length === 0 && !error && (
          <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>問い合わせが見つかりませんでした</p>
        )}

        {totalPages > 1 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={() => loadPage(page - 1, filterStatus)}
              disabled={page === 0}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #cbd5e1', cursor: page === 0 ? 'not-allowed' : 'pointer', background: '#fff' }}
            >
              前へ
            </button>
            <span style={{ color: '#475569' }}>{page + 1} / {totalPages}</span>
            <button
              onClick={() => loadPage(page + 1, filterStatus)}
              disabled={page >= totalPages - 1}
              style={{ padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #cbd5e1', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', background: '#fff' }}
            >
              次へ
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
