import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { listTerms, type TermsOfService } from '../api/terms';
import styles from '../styles/AdminShared.module.css';

const now = () => new Date();

const getStatus = (effectiveDate: string): { label: string; status: 'scheduled' | 'active' } => {
  const effective = new Date(effectiveDate);
  if (effective > now()) return { label: '施行予定', status: 'scheduled' };
  return { label: '施行済み', status: 'active' };
};

export const AdminTermsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [termsList, setTermsList] = useState<TermsOfService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listTerms()
      .then(setTermsList)
      .catch(() => setError('利用規約一覧の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageMedium}>
        <div className={styles.headerRow}>
          <h1 className={styles.titleSmall}>利用規約管理</h1>
          <button
            onClick={() => navigate('/admin/terms/new')}
            className={styles.primaryButton}
          >
            新規登録
          </button>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}
        {loading && <p className={styles.emptyState}>読み込み中...</p>}

        {!loading && termsList.length === 0 && (
          <p className={styles.emptyState}>登録された利用規約はありません</p>
        )}

        {!loading && termsList.length > 0 && (
          <table className={styles.compactTable}>
            <thead>
              <tr className={styles.tableHeaderRowStrong}>
                <th className={styles.mutedTableHeader}>バージョン</th>
                <th className={styles.mutedTableHeader}>施行日時</th>
                <th className={styles.mutedTableHeader}>登録日時</th>
                <th className={styles.mutedTableHeader}>ステータス</th>
                <th className={styles.mutedTableHeader}></th>
              </tr>
            </thead>
            <tbody>
              {termsList.map((t) => {
                const status = getStatus(t.effectiveDate);
                return (
                  <tr key={t.ID} className={styles.tableRow}>
                    <td className={styles.tableCellBody}>
                      <span className={styles.strongText}>{t.version}</span>
                    </td>
                    <td className={styles.tableCellBody}>{new Date(t.effectiveDate).toLocaleString('ja-JP')}</td>
                    <td className={styles.tableCellBody}>{new Date(t.createdAt).toLocaleString('ja-JP')}</td>
                    <td className={styles.tableCellBody}>
                      <span className={styles.termsStatusBadge} data-status={status.status}>
                        {status.label}
                      </span>
                    </td>
                    <td className={styles.tableCellBody}>
                      <button
                        onClick={() => navigate(`/admin/terms/${t.ID}`)}
                        className={styles.outlinePrimaryButton}
                      >
                        同意状況
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};
