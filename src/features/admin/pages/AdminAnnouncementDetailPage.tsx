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
    <div>
      <AdminHeader />
      <main className={styles.formPage}>
        <button
          onClick={() => navigate('/admin/announcements')}
        >
          <ChevronLeft /> お知らせ一覧に戻る
        </button>

        {error && <p className={styles.formError}>{error}</p>}

        {loading ? (
          <p className={styles.centerMuted}>読み込み中...</p>
        ) : !announcement ? (
          <p className={styles.centerMuted}>お知らせが見つかりません</p>
        ) : isEditing ? (
          <form onSubmit={handleUpdate} className={styles.adminForm}>
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
            <div className={styles.buttonRow}>
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
          <div className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <span className={styles.noticeBadge}>
                運営からのお知らせ
              </span>
              <div className={styles.buttonRowCompact}>
                <button
                  onClick={() => setIsEditing(true)}
                  className={styles.secondaryButtonSmall}
                >
                  編集
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className={`${styles.dangerButtonSmall} ${submitting ? styles.disabled : ''}`}
                >
                  削除
                </button>
              </div>
            </div>
            <h1 className={styles.detailTitle}>
              {announcement.title}
            </h1>
            <p className={styles.detailMeta}>
              {new Date(announcement.createdAt).toLocaleString('ja-JP')}
            </p>
            <div className={styles.markdownBody}>
              <ReactMarkdown>{announcement.body}</ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
