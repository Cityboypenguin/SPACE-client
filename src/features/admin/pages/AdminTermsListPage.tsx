import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { listTerms, type TermsOfService } from '../api/terms';

const now = () => new Date();

const getStatus = (effectiveDate: string): { label: string; color: string } => {
  const effective = new Date(effectiveDate);
  if (effective > now()) return { label: '施行予定', color: '#f59e0b' };
  return { label: '施行済み', color: '#10b981' };
};

export const AdminTermsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [termsList, setTermsList] = useState<TermsOfService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listTerms()
      .then(setTermsList)
      .catch(() => setError('利用規約一覧の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>利用規約管理</h1>
          <button
            onClick={() => navigate('/admin/terms/new')}
            style={{
              padding: '0.5rem 1.25rem',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            新規登録
          </button>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loading && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>読み込み中...</p>}

        {!loading && termsList.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>登録された利用規約はありません</p>
        )}

        {!loading && termsList.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thStyle}>バージョン</th>
                <th style={thStyle}>施行日時</th>
                <th style={thStyle}>登録日時</th>
                <th style={thStyle}>ステータス</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {termsList.map((t) => {
                const status = getStatus(t.effectiveDate);
                return (
                  <tr key={t.ID} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{t.version}</span>
                    </td>
                    <td style={tdStyle}>{new Date(t.effectiveDate).toLocaleString('ja-JP')}</td>
                    <td style={tdStyle}>{new Date(t.createdAt).toLocaleString('ja-JP')}</td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 12,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: status.color + '20',
                        color: status.color,
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => navigate(`/admin/terms/${t.ID}`)}
                        style={{
                          padding: '0.3rem 0.9rem',
                          background: '#fff',
                          color: '#3b82f6',
                          border: '1px solid #3b82f6',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        同意状況
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontWeight: 600,
  color: '#475569',
  fontSize: '0.85rem',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  color: '#334155',
  verticalAlign: 'middle',
};
