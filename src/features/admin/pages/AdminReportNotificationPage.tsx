import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import {
  addReportNotificationRecipient,
  getReportNotificationRecipients,
  removeReportNotificationRecipient,
  type ReportNotificationRecipient,
} from '../api/report';
import { toUserMessage } from '../../../lib/errorMessages';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from '../styles/AdminShared.module.css';

export const AdminReportNotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<ReportNotificationRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getReportNotificationRecipients()
      .then(setRecipients)
      .catch((err) => {
        console.error(err);
        setError('通知先の取得に失敗しました');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const added = await addReportNotificationRecipient(email);
      setRecipients((prev) => [...prev, added]);
      setEmail('');
    } catch (err) {
      setError(toUserMessage(err, '通知先の追加に失敗しました'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (recipient: ReportNotificationRecipient) => {
    if (!window.confirm(`${recipient.email} を通知先から削除しますか？`)) return;
    setError('');
    try {
      await removeReportNotificationRecipient(recipient.ID);
      setRecipients((prev) => prev.filter((r) => r.ID !== recipient.ID));
    } catch (err) {
      setError(toUserMessage(err, '通知先の削除に失敗しました'));
    }
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCenteredNarrow}>
        <div className={styles.pageIntro}>
          <button onClick={() => navigate('/admin/reports')}>
            <ChevronLeft /> 通報一覧に戻る
          </button>
          <h1 className={styles.titleLarge}>通報の通知先メール</h1>
          <p className={styles.cellMuted}>
            通報を受け付けると、ここに登録したアドレスへお知らせメールを送ります。メールに通報の内容は載りません。
          </p>
        </div>

        {error && <p className={styles.errorPadded}>{error}</p>}

        <form onSubmit={handleAdd} className={styles.toolbar}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            aria-label="追加するメールアドレス"
            className={styles.input}
          />
          <button type="submit" disabled={submitting} className={styles.primaryButton}>
            {submitting ? '追加中...' : '追加'}
          </button>
        </form>

        {loading ? (
          <p className={styles.cellMuted}>読み込み中...</p>
        ) : recipients.length === 0 ? (
          <p className={styles.emptyState}>通知先が登録されていません。登録するまでメールは送られません。</p>
        ) : (
          <div className={styles.tablePanelPlain}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableCellLarge}>メールアドレス</th>
                  <th className={styles.tableCellLarge}>登録日時</th>
                  <th className={styles.tableCellLarge}>操作</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient) => (
                  <tr key={recipient.ID} className={styles.tableRow}>
                    <td className={styles.tableCellLarge} style={{ overflowWrap: 'anywhere' }}>{recipient.email}</td>
                    <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>
                      {new Date(recipient.createdAt).toLocaleString('ja-JP')}
                    </td>
                    <td className={styles.tableCellLarge}>
                      <button type="button" onClick={() => handleRemove(recipient)} className={styles.dangerButton}>
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
