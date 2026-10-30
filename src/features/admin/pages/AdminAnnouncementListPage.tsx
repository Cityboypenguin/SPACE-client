import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { getAdminAnnouncements, type Announcement } from '../api/announcements';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';
import styles from '../styles/AdminShared.module.css';

export const AdminAnnouncementListPage: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('announcements');
  const [error, setError] = useState('');

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = useCallback((p: number, size = pageSize) => {
    setError('');
    getAdminAnnouncements(size, p * size)
      .then((data) => {
        setAnnouncements(data.items);
        setTotal(data.total);
        setPage(p);
      })
      .catch(() => setError('お知らせ一覧の取得に失敗しました'));
  }, [pageSize]);

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0));
  }, [loadPage]);

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>お知らせ管理</h1>
        </div>

        <div className={styles.toolbar}>
          <div>
            <button
              type="button"
              onClick={() => navigate('/admin/announcements/new')}
              className={styles.primaryButton}
            >
              新規作成
            </button>
          </div>
          <div className={styles.toolbarGroup}>
            <span className={styles.countText}>全 {total} 件</span>
            <AdminPageSizeSelect value={pageSize} onChange={setPageSize} />
          </div>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}

        {announcements.length === 0 && !error ? (
          <p className={styles.emptyState}>お知らせはありません</p>
        ) : (
          <div className={styles.tablePanelPlain}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableCellLarge}>タイトル</th>
                  <th className={styles.tableCellLarge} style={{ width: '220px' }}>作成日時</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr
                    key={a.ID}
                    onClick={() => navigate(`/admin/announcements/${a.ID}`)}
                    className={styles.tableRow}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className={styles.tableCellLarge} style={{ fontWeight: 500 }}>
                      {a.title}
                    </td>
                    <td className={`${styles.tableCellLarge} ${styles.cellMuted}`}>
                      {new Date(a.createdAt).toLocaleString('ja-JP')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPrev={() => loadPage(page - 1)}
            onNext={() => loadPage(page + 1)}
          />
        )}
      </main>
    </div>
  );
};
