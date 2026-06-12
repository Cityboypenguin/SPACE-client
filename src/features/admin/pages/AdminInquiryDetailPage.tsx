import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getInquiry, updateInquiryStatus } from '../api/inquiry';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';

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

export const AdminInquiryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getInquiry(id)
      .then(setInquiry)
      .catch((err) => {
        console.error(err);
        setError('問い合わせの取得に失敗しました');
      });
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id || !window.confirm(`ステータスを「${STATUS_LABEL[newStatus]}」に変更しますか？`)) return;
    try {
      setError('');
      const updated = await updateInquiryStatus(id, newStatus);
      setInquiry((prev) => prev ? { ...prev, status: updated.status } : prev);
    } catch (err) {
      console.error(err);
      setError('ステータスの更新に失敗しました');
    }
  };

  const sc = inquiry ? (STATUS_COLOR[inquiry.status] ?? { bg: '#f1f5f9', color: '#475569' }) : null;

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('/admin/inquiries')}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.95rem', padding: 0, marginBottom: '1rem', display: 'block' }}
          >
            <ChevronLeft /> 問い合わせ一覧に戻る
          </button>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, color: '#1e293b' }}>
            問い合わせ詳細
          </h1>
        </div>

        {error && <p style={{ color: 'red', padding: '1rem' }}>{error}</p>}

        {inquiry && sc && (
          <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{
                padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.9rem', fontWeight: 600,
                background: sc.bg, color: sc.color,
              }}>
                {STATUS_LABEL[inquiry.status] ?? inquiry.status}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                受信：{new Date(inquiry.createdAt).toLocaleString('ja-JP')}
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
              <tbody>
                {[
                  { label: '件名', value: inquiry.subject },
                  { label: '氏名', value: inquiry.name },
                  { label: 'メールアドレス', value: inquiry.email },
                ].map(({ label, value }) => (
                  <tr key={label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '140px', color: '#64748b', fontWeight: 500, background: '#f8fafc' }}>
                      {label}
                    </th>
                    <td style={{ padding: '0.75rem 1rem', color: '#1e293b' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 500, color: '#64748b' }}>お問い合わせ内容</p>
              <div style={{
                padding: '1rem', background: '#f8fafc', borderRadius: 6,
                color: '#1e293b', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '0.95rem',
              }}>
                {inquiry.content}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {inquiry.status === 'PENDING' && (
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  style={{ padding: '0.5rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                >
                  対応中にする
                </button>
              )}
              {inquiry.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  style={{ padding: '0.5rem 1.2rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                >
                  対応済にする
                </button>
              )}
              {inquiry.status === 'RESOLVED' && (
                <button
                  onClick={() => handleUpdateStatus('PENDING')}
                  style={{ padding: '0.5rem 1.2rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                >
                  未対応に戻す
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
