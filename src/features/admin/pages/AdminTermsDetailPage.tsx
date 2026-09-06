import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { listTerms, listConsents, type TermsOfService, type TermsConsentRecord } from '../api/terms';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';
import styles from '../styles/AdminShared.module.css';

export const AdminTermsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [terms, setTerms] = useState<TermsOfService | null>(null);
  const [consents, setConsents] = useState<TermsConsentRecord[]>([]);
  const [consentTotal, setConsentTotal] = useState(0);
  const [consentPage, setConsentPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('terms');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = Math.ceil(consentTotal / pageSize);

  const loadConsents = useCallback((p: number, size = pageSize) => {
    if (!id) return;
    listConsents(id, size, p * size)
      .then((data) => {
        setConsents(data.items);
        setConsentTotal(data.total);
        setConsentPage(p);
      })
      .catch(() => setError('同意者一覧の取得に失敗しました'));
  }, [id, pageSize]);

  useEffect(() => {
    if (!id) return;
    void Promise.resolve().then(() => {
      listTerms()
        .then((allTerms) => {
          const found = allTerms.find((t) => t.ID === id) ?? null;
          setTerms(found);
        })
        .catch(() => setError('データの取得に失敗しました'))
        .finally(() => setLoading(false));
      loadConsents(0);
    });
  }, [id, loadConsents]);

  useEffect(() => {
    void Promise.resolve().then(() => loadConsents(0));
  }, [loadConsents]);

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageMedium}>
        <button
          onClick={() => navigate('/admin/terms')}
        >
          <ChevronLeft /> 利用規約一覧に戻る
        </button>

        {error && <p className={styles.errorText}>{error}</p>}
        {loading && <p className={styles.emptyState}>読み込み中...</p>}

        {!loading && terms && (
          <>
            <div className={styles.summaryCard}>
              <h1 className={styles.summaryTitle}>
                バージョン {terms.version}
              </h1>
              <div className={styles.summaryGrid}>
                <div><span className={styles.strongText}>施行日時：</span>{new Date(terms.effectiveDate).toLocaleString('ja-JP')}</div>
                <div><span className={styles.strongText}>登録日時：</span>{new Date(terms.createdAt).toLocaleString('ja-JP')}</div>
              </div>
            </div>

            <div className={styles.sectionToolbar}>
              <h2 className={styles.sectionHeading}>同意ユーザー一覧</h2>
              <span className={styles.countBadge}>
                {consentTotal}人
              </span>
              <div className={styles.pushRight}>
                <AdminPageSizeSelect value={pageSize} onChange={setPageSize} muted />
              </div>
            </div>

            {consents.length === 0 ? (
              <p className={styles.emptyState}>
                まだ同意したユーザーはいません
              </p>
            ) : (
              <table className={styles.compactTable}>
                <thead>
                  <tr className={styles.tableHeaderRowStrong}>
                    <th className={styles.mutedTableHeader}>ユーザー名</th>
                    <th className={styles.mutedTableHeader}>アカウントID</th>
                    <th className={styles.mutedTableHeader}>メールアドレス</th>
                    <th className={styles.mutedTableHeader}>同意日時</th>
                  </tr>
                </thead>
                <tbody>
                  {consents.map((c) => (
                    <tr
                      key={c.ID}
                      className={styles.clickableRow}
                      onClick={() => navigate(`/admin/users/${c.user.ID}`)}
                    >
                      <td className={styles.tableCellBody}>
                        <span className={styles.strongText}>{c.user.name}</span>
                      </td>
                      <td className={styles.tableCellBody}>@{c.user.accountID}</td>
                      <td className={styles.tableCellBody}>{c.user.email}</td>
                      <td className={styles.tableCellBody}>{new Date(c.consentedAt).toLocaleString('ja-JP')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <AdminPagination
              page={consentPage}
              totalPages={totalPages}
              onPrev={() => loadConsents(consentPage - 1)}
              onNext={() => loadConsents(consentPage + 1)}
            />
          </>
        )}

        {!loading && !terms && !error && (
          <p className={styles.emptyState}>
            利用規約が見つかりませんでした
          </p>
        )}
      </main>
    </div>
  );
};
