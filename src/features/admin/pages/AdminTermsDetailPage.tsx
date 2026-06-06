import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { listTerms, listConsents, type TermsOfService, type TermsConsentRecord } from '../api/terms';

export const AdminTermsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [terms, setTerms] = useState<TermsOfService | null>(null);
  const [consents, setConsents] = useState<TermsConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([listTerms(), listConsents(id)])
      .then(([allTerms, consentList]) => {
        const found = allTerms.find((t) => t.ID === id) ?? null;
        setTerms(found);
        setConsents(consentList);
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
        <button
          onClick={() => navigate('/admin/terms')}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '1rem',
            padding: 0,
          }}
        >
          ← 利用規約一覧に戻る
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {loading && <p style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>読み込み中...</p>}

        {!loading && terms && (
          <>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
            }}>
              <h1 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>
                バージョン {terms.version}
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.88rem', color: '#475569' }}>
                <div><span style={{ fontWeight: 600 }}>施行日時：</span>{new Date(terms.effectiveDate).toLocaleString('ja-JP')}</div>
                <div><span style={{ fontWeight: 600 }}>登録日時：</span>{new Date(terms.createdAt).toLocaleString('ja-JP')}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>同意ユーザー一覧</h2>
              <span style={{
                background: '#dbeafe',
                color: '#1d4ed8',
                borderRadius: 12,
                padding: '0.15rem 0.6rem',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}>
                {consents.length}人
              </span>
            </div>

            {consents.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                まだ同意したユーザーはいません
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={thStyle}>ユーザー名</th>
                    <th style={thStyle}>アカウントID</th>
                    <th style={thStyle}>メールアドレス</th>
                    <th style={thStyle}>同意日時</th>
                  </tr>
                </thead>
                <tbody>
                  {consents.map((c) => (
                    <tr
                      key={c.ID}
                      style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/users/${c.user.ID}`)}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{c.user.name}</span>
                      </td>
                      <td style={tdStyle}>@{c.user.accountID}</td>
                      <td style={tdStyle}>{c.user.email}</td>
                      <td style={tdStyle}>{new Date(c.consentedAt).toLocaleString('ja-JP')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {!loading && !terms && !error && (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
            利用規約が見つかりませんでした
          </p>
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
