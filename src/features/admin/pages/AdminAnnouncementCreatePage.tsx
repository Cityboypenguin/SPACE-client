import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { createAnnouncement } from '../api/announcements';
import styles from '../styles/AdminShared.module.css';

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
      <main className={styles.formPage}>
        <h1 className={styles.formPageTitle}>
          お知らせ作成
        </h1>

        {error && <p className={styles.formError}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.adminForm}>
          <div>
            <label className={styles.fieldLabel}>
              タイトル
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="例: 利用規約の改定について"
              className={styles.formInput}
            />
          </div>

          <div>
            <label className={styles.fieldLabel}>
              本文（マークダウン形式）
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder={'## 見出し\n\n本文をマークダウンで記述できます。\n\n- リスト\n- リスト'}
              className={`${styles.formInput} ${styles.monoTextarea}`}
            />
            <p className={styles.formHelp}>
              マークダウン形式で記述できます
            </p>
          </div>

          <div className={styles.buttonRow}>
            <button
              type="submit"
              disabled={submitting}
              className={`${styles.primaryButtonLargeRounded} ${submitting ? styles.disabled : ''}`}
            >
              {submitting ? '送信中...' : '送信する'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/announcements')}
              className={styles.secondaryButtonLarge}
            >
              キャンセル
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
