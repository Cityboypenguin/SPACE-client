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
      <main className={styles.pageNarrow}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.titleSmall}>お知らせ管理</h1>
            <div className={styles.listMetaRowSpaced}>
              <span className={styles.countText}>全 {total} 件</span>
              <AdminPageSizeSelect value={pageSize} onChange={setPageSize} />
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/announcements/new')}
            className={styles.primaryButton}
          >
            新規作成
          </button>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        {announcements.length === 0 && !error ? (
          <p className={styles.emptyState}>お知らせはありません</p>
        ) : (
          <ul className={styles.plainList}>
            {announcements.map((a) => (
              <li
                key={a.ID}
                onClick={() => navigate(`/admin/announcements/${a.ID}`)}
                className={styles.listItem}
              >
                <span className={styles.listItemTitle}>{a.title}</span>
                <span className={styles.listItemMeta}>
                  {new Date(a.createdAt).toLocaleString('ja-JP')}
                </span>
              </li>
            ))}
          </ul>
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPrev={() => loadPage(page - 1)}
          onNext={() => loadPage(page + 1)}
        />
      </main>
    </div>
  );
};
