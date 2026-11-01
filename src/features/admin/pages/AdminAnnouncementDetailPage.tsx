import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getAnnouncement, updateAnnouncement, deleteAnnouncement, type Announcement } from '../api/announcements';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from '../styles/AdminShared.module.css';

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AdminHeader />
      <main className={styles.pageCentered} style={{ maxWidth: '900px', width: '100%', boxSizing: 'border-box' }}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>お知らせ管理</h1>
        </div>

        {/* ツールバーエリアとして「一覧に戻る」を配置し下余白を統一 */}
        <div className={styles.toolbar} style={{ marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/announcements')}
            className={styles.paginationButton}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft /> 一覧に戻る
          </button>
        </div>

        {error && <p className={styles.formError}>{error}</p>}

        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>お知らせ詳細</h2>

        {loading ? (
          <p className={styles.cellMuted}>読み込み中...</p>
        ) : !announcement ? (
          <p className={styles.cellMuted}>お知らせが見つかりません</p>
        ) : isEditing ? (
          <form onSubmit={handleUpdate} className={styles.adminForm} style={{ textAlign: 'left' }}>
            <h2 className={styles.formSectionTitle}>お知らせを編集</h2>
            <div>
              <label className={styles.fieldLabel}>
                タイトル
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={255}
                className={styles.formInput}
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>
                本文（マークダウン形式）
              </label>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={12}
                className={`${styles.formInput} ${styles.monoTextarea}`}
              />
            </div>
            <div className={styles.buttonRow} style={{ justifyContent: 'flex-start' }}>
              <button
                type="submit"
                disabled={submitting}
                className={`${styles.primaryButtonLargeRounded} ${submitting ? styles.disabled : ''}`}
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
                className={styles.secondaryButtonLarge}
              >
                キャンセル
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.tablePanelPlain} style={{ padding: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className={styles.noticeBadge}>
                運営からのお知らせ
              </span>
              <div className={styles.buttonRowCompact}>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={styles.secondaryButtonSmall}
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className={`${styles.dangerButtonSmall} ${submitting ? styles.disabled : ''}`}
                >
                  削除
                </button>
              </div>
            </div>

            <h1 className={styles.detailTitle} style={{ textAlign: 'left', margin: '0 0 8px 0', fontSize: '1.5rem' }}>
              {announcement.title}
            </h1>
            <p className={styles.detailMeta} style={{ textAlign: 'left', color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
              {new Date(announcement.createdAt).toLocaleString('ja-JP')}
            </p>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />
            <div className={styles.markdownBody} style={{ textAlign: 'left', lineHeight: 1.7, color: '#1e293b' }}>
              <ReactMarkdown>{announcement.body}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
