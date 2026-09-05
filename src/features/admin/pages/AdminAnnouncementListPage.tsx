import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getAdminAnnouncements, type Announcement } from '../api/announcements';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';

export const AdminAnnouncementListPage: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('announcements');
  const [error, setError] = useState('');

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = useCallback((p: number, size = pageSize) => {
    setError('');
    getAdminAnnouncements(size, p * size)
      .then((data) => {
        setAnnouncements(data.items);
        setTotal(data.total);
        setPage(p);
      })
      .catch(() => setError('お知らせ一覧の取得に失敗しました'));
  }, [pageSize]);

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0));
  }, [loadPage]);

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>お知らせ管理</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>全 {total} 件</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                表示件数
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: '0.25rem 0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}件</option>)}
                </select>
              </label>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/announcements/new')}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'var(--color-primary)',
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

        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

        {announcements.length === 0 && !error ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>お知らせはありません</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {announcements.map((a) => (
              <li
                key={a.ID}
                onClick={() => navigate(`/admin/announcements/${a.ID}`)}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{a.title}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {new Date(a.createdAt).toLocaleString('ja-JP')}
                </span>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={() => loadPage(page - 1)} disabled={page === 0}>前へ</button>
            <span>{page + 1} / {totalPages}</span>
            <button onClick={() => loadPage(page + 1)} disabled={page >= totalPages - 1}>次へ</button>
          </div>
        )}
      </main>
    </div>
  );
};
