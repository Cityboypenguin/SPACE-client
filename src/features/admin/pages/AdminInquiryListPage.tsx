import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getInquiries } from '../api/inquiry';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import styles from '../styles/AdminShared.module.css';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';

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

const CATEGORY_LABEL: Record<string, string> = {
  DM: 'DMに関して',
  POST: '投稿機能に関して',
  COMMUNITY: 'コミュニティに関して',
  PASSWORD: 'パスワード変更',
  LOGIN: 'ログインに関して',
  OTHER: 'その他のお問い合わせ',
};

export const AdminInquiryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('inquiry');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [error, setError] = useState('');

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = useCallback((p: number, status: string, size = pageSize) => {
    setError('');
    getInquiries(status, size, p * size)
      .then((data) => {
        setInquiries(data.items);
        setTotal(data.total);
        setPage(p);
      })
      .catch((err) => {
        console.error(err);
        setError('問い合わせ一覧の取得に失敗しました');
      });
  }, [pageSize]);

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0, filterStatus));
  }, [filterStatus, loadPage]);

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>
            問い合わせ管理
          </h1>
        </div>

        <div className={styles.toolbar}>
          <div>
            <label className={styles.label}>
              ステータス絞り込み：
            </label>
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value)}
              className={styles.select}
            >
              <option value="ALL">すべて</option>
              <option value="PENDING">未対応</option>
              <option value="IN_PROGRESS">対応中</option>
              <option value="RESOLVED">対応済</option>
            </select>
          </div>
          <div className={styles.toolbarGroup}>
            <span className={styles.countText}>全 {total} 件</span>
            <AdminPageSizeSelect value={pageSize} onChange={setPageSize} />
          </div>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}

        <div className={styles.tablePanelPlain}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableCellLarge}>件名</th>
                <th className={styles.tableCellLarge}>氏名</th>
                <th className={styles.tableCellLarge}>メールアドレス</th>
                <th className={styles.tableCellLarge}>どのようなお問い合わせか</th>
                <th className={styles.tableCellLarge}>ステータス</th>
                <th className={styles.tableCellLarge}>受信日時</th>
                <th className={styles.tableCellLarge}>詳細</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className={styles.tableRow}>
                    <td className={styles.tableCellLarge}>{inquiry.subject || '---'}</td>
                    <td className={styles.tableCellLarge}>{inquiry.name}</td>
                    <td className={`${styles.tableCellLarge} ${styles.cellText}`}>{inquiry.email}</td>
                    <td className={styles.tableCellLarge}>{CATEGORY_LABEL[inquiry.category] ?? inquiry.category}</td>
                    <td className={styles.tableCellLarge}>
                      <span className={styles.statusBadge} data-status={inquiry.status}>
                        {STATUS_LABEL[inquiry.status] ?? inquiry.status}
                      </span>
                    </td>
                    <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>
                      {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString('ja-JP') : '---'}
                    </td>
                    <td className={styles.tableCellLarge}>
                      <button
                        onClick={() => navigate(`/admin/inquiries/${inquiry.id}`)}
                        className={styles.primaryButton}
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {inquiries.length === 0 && !error && (
          <p className={styles.emptyState}>問い合わせが見つかりませんでした</p>
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPrev={() => loadPage(page - 1, filterStatus)}
          onNext={() => loadPage(page + 1, filterStatus)}
        />
      </main>
    </div>
  );
};
