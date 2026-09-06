import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getInquiry, updateInquiryStatus } from '../api/inquiry';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from '../styles/AdminShared.module.css';

const CATEGORY_LABEL: Record<string, string> = {
  DM: 'DMに関して',
  POST: '投稿機能に関して',
  COMMUNITY: 'コミュニティに関して',
  PASSWORD: 'パスワード変更',
  LOGIN: 'ログインに関して',
  OTHER: 'その他のお問い合わせ',
};

type Inquiry = {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: '未対応',
  IN_PROGRESS: '対応中',
  RESOLVED: '対応済',
};

export const AdminInquiryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getInquiry(id)
      .then(setInquiry)
      .catch((err) => {
        console.error(err);
        setError('問い合わせの取得に失敗しました');
      });
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id || !window.confirm(`ステータスを「${STATUS_LABEL[newStatus]}」に変更しますか？`)) return;
    try {
      setError('');
      const updated = await updateInquiryStatus(id, newStatus);
      setInquiry((prev) => prev ? { ...prev, status: updated.status } : prev);
    } catch (err) {
      console.error(err);
      setError('ステータスの更新に失敗しました');
    }
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCenteredNarrow}>
        <div className={styles.pageIntro}>
          <button
            onClick={() => navigate('/admin/inquiries')}
          >
            <ChevronLeft /> 問い合わせ一覧に戻る
          </button>
          <h1 className={styles.titleLarge}>
            問い合わせ詳細
          </h1>
        </div>

        {error && <p className={styles.errorPadded}>{error}</p>}

        {inquiry && (
          <div className={styles.detailPanel}>
            <div className={styles.statusHeader}>
              <span className={styles.statusBadgeLarge} data-status={inquiry.status}>
                {STATUS_LABEL[inquiry.status] ?? inquiry.status}
              </span>
              <span className={styles.countText}>
                受信：{new Date(inquiry.createdAt).toLocaleString('ja-JP')}
              </span>
            </div>

            <table className={styles.detailTable}>
              <tbody>
                {[
                  { label: 'お問合せ種別', value: CATEGORY_LABEL[inquiry.category] ?? inquiry.category },
                  { label: '件名', value: inquiry.subject },
                  { label: '氏名', value: inquiry.name },
                  { label: 'メールアドレス', value: inquiry.email },
                ].map(({ label, value }) => (
                  <tr key={label} className={styles.tableRow}>
                    <th className={styles.detailTableHeader}>
                      {label}
                    </th>
                    <td className={styles.tableCellBody}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.detailSection}>
              <p className={styles.detailSectionLabel}>お問い合わせ内容</p>
              <div className={styles.preWrapContent}>
                {inquiry.content}
              </div>
            </div>

            <div className={styles.buttonRow}>
              {inquiry.status === 'PENDING' && (
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className={styles.primaryButton}
                >
                  対応中にする
                </button>
              )}
              {inquiry.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  className={`${styles.primaryButton} ${styles.successButton}`}
                >
                  対応済にする
                </button>
              )}
              {inquiry.status === 'RESOLVED' && (
                <button
                  onClick={() => handleUpdateStatus('PENDING')}
                  className={`${styles.primaryButton} ${styles.warningButton}`}
                >
                  未対応に戻す
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
