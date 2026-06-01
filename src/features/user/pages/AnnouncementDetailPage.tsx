import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { UserHeader } from '../components/organisms/UserHeader';
import { getAnnouncement, type Announcement } from '../api/announcement';

export const AnnouncementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getAnnouncement(id)
      .then(setAnnouncement)
      .catch(() => setError('お知らせの読み込みに失敗しました'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <UserHeader />
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '1rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#3b82f6',
            fontSize: '0.875rem',
            padding: '0.25rem 0',
            marginBottom: '1rem',
          }}
        >
          ← 戻る
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>読み込み中...</p>
        ) : !announcement ? (
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>お知らせが見つかりません</p>
        ) : (
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '1.5rem 2rem',
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 12,
                  background: '#fef3c7',
                  color: '#92400e',
                  fontWeight: 600,
                }}
              >
                運営からのお知らせ
              </span>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.75rem 0 0.25rem', color: '#1e293b' }}>
              {announcement.title}
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1.5rem' }}>
              {new Date(announcement.createdAt).toLocaleString('ja-JP')}
            </p>
            <div
              style={{
                lineHeight: 1.8,
                color: '#334155',
                fontSize: '0.95rem',
              }}
              className="announcement-body"
            >
              <ReactMarkdown>{announcement.body}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
