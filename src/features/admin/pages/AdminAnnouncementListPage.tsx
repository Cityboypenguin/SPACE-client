import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getAnnouncements, type Announcement } from '../api/announcements';

export const AdminAnnouncementListPage: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnnouncements()
      .then(setAnnouncements)
      .catch(() => setError('お知らせ一覧の取得に失敗しました'));
  }, []);

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>お知らせ管理</h1>
          <button
            onClick={() => navigate('/admin/announcements/new')}
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
            新規作成
          </button>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {announcements.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>お知らせはありません</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {announcements.map((a) => (
              <li
                key={a.ID}
                onClick={() => navigate(`/admin/announcements/${a.ID}`)}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{a.title}</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {new Date(a.createdAt).toLocaleString('ja-JP')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};
