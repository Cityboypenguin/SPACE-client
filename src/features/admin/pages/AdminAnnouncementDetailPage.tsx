import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getAnnouncement, updateAnnouncement, deleteAnnouncement, type Announcement } from '../api/announcements';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';

export const AdminAnnouncementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getAnnouncement(id)
      .then((a) => {
        setAnnouncement(a);
        setEditTitle(a.title);
        setEditBody(a.body);
      })
      .catch(() => setError('お知らせの読み込みに失敗しました'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editTitle.trim() || !editBody.trim()) {
      setError('タイトルと本文は必須です');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const updated = await updateAnnouncement(id, editTitle.trim(), editBody.trim());
      setAnnouncement(updated);
      setIsEditing(false);
    } catch {
      setError('お知らせの更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('このお知らせを削除しますか？この操作は取り消せません。')) return;
    setSubmitting(true);
    setError('');
    try {
      await deleteAnnouncement(id);
      navigate('/admin/announcements');
    } catch {
      setError('お知らせの削除に失敗しました');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
        <button
          onClick={() => navigate('/admin/announcements')}
        >
          <ChevronLeft /> お知らせ一覧に戻る
        </button>

        {error && <p style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{error}</p>}

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>読み込み中...</p>
        ) : !announcement ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>お知らせが見つかりません</p>
        ) : isEditing ? (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>お知らせを編集</h2>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                タイトル
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={255}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                本文（マークダウン形式）
              </label>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={12}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: '0.95rem',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.6rem 1.5rem',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                {submitting ? '更新中...' : '更新する'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(announcement.title);
                  setEditBody(announcement.body);
                  setError('');
                }}
                style={{
                  padding: '0.6rem 1.5rem',
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                キャンセル
              </button>
            </div>
          </form>
        ) : (
          <div
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: '1.5rem 2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 12,
                  background: 'var(--color-warning-bg)',
                  color: 'var(--color-warning)',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                運営からのお知らせ
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '0.35rem 1rem',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  編集
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  style={{
                    padding: '0.35rem 1rem',
                    background: 'var(--color-danger-bg)',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 8,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  削除
                </button>
              </div>
            </div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                margin: '0 0 0.25rem',
                color: 'var(--color-text)',
              }}
            >
              {announcement.title}
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 1.5rem' }}>
              {new Date(announcement.createdAt).toLocaleString('ja-JP')}
            </p>
            <div
              style={{
                lineHeight: 1.8,
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '1.25rem',
              }}
            >
              <ReactMarkdown>{announcement.body}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
