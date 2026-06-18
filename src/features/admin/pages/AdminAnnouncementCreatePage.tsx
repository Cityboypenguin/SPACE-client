import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { createAnnouncement } from '../api/announcements';

export const AdminAnnouncementCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('タイトルと本文は必須です');
      return;
    }
    if (!window.confirm('このお知らせを全ユーザーに送信しますか？')) return;
    setSubmitting(true);
    setError('');
    try {
      await createAnnouncement(title.trim(), body.trim());
      navigate('/admin/announcements');
    } catch {
      setError('お知らせの作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminHeader />
      <main style={{ maxWidth: 700, margin: '2rem auto', padding: '0 1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          お知らせ作成
        </h1>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              タイトル
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="例: 利用規約の改定について"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid #cbd5e1',
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
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder={'## 見出し\n\n本文をマークダウンで記述できます。\n\n- リスト\n- リスト'}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
              マークダウン形式で記述できます
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.6rem 1.5rem',
                background: submitting ? '#93c5fd' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              {submitting ? '送信中...' : '送信する'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/announcements')}
              style={{
                padding: '0.6rem 1.5rem',
                background: '#fff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              キャンセル
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
