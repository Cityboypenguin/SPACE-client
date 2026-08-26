import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getInquiry, updateInquiryStatus } from '../api/inquiry';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';

const CATEGORY_LABEL: Record<string, string> = {
  DM: 'DMに関して',
  POST: '投稿機能に関して',
  COMMUNITY: 'コミュニティに関して',
  PASSWORD: 'パスワード変更',
  LOGIN: 'ログインに関して',
  OTHER: 'その他のお問い合わせ',
};

type Inquiry = {
  id: string;
  name: string;
  email: string;
  category: string;
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
  PENDING: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  IN_PROGRESS: { bg: '#dbeafe', color: '#1d4ed8' },
  RESOLVED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
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

  const sc = inquiry ? (STATUS_COLOR[inquiry.status] ?? { bg: 'var(--color-surface)', color: 'var(--color-text)' }) : null;

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('/admin/inquiries')}
          >
            <ChevronLeft /> 問い合わせ一覧に戻る
          </button>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text)' }}>
            問い合わせ詳細
          </h1>
        </div>

        {error && <p style={{ color: 'var(--color-danger)', padding: '1rem' }}>{error}</p>}

        {inquiry && sc && (
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{
                padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.9rem', fontWeight: 600,
                background: sc.bg, color: sc.color,
              }}>
                {STATUS_LABEL[inquiry.status] ?? inquiry.status}
              </span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                受信：{new Date(inquiry.createdAt).toLocaleString('ja-JP')}
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
              <tbody>
                {[
                  { label: 'お問合せ種別', value: CATEGORY_LABEL[inquiry.category] ?? inquiry.category },
                  { label: '件名', value: inquiry.subject },
                  { label: '氏名', value: inquiry.name },
                  { label: 'メールアドレス', value: inquiry.email },
                ].map(({ label, value }) => (
                  <tr key={label} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '140px', color: 'var(--color-text-muted)', fontWeight: 500, background: 'var(--color-surface)' }}>
                      {label}
                    </th>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text)' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>お問い合わせ内容</p>
              <div style={{
                padding: '1rem', background: 'var(--color-surface)', borderRadius: 6,
                color: 'var(--color-text)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '0.95rem',
              }}>
                {inquiry.content}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {inquiry.status === 'PENDING' && (
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  style={{ padding: '0.5rem 1.2rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                >
                  対応中にする
                </button>
              )}
              {inquiry.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  style={{ padding: '0.5rem 1.2rem', background: 'var(--color-success)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                >
                  対応済にする
                </button>
              )}
              {inquiry.status === 'RESOLVED' && (
                <button
                  onClick={() => handleUpdateStatus('PENDING')}
                  style={{ padding: '0.5rem 1.2rem', background: 'var(--color-warning)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
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
