import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunities, type Community } from '../api/communities';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';
import { AdminPageSizeSelect } from '../components/molecules/AdminPageSizeSelect';
import { AdminPagination } from '../components/molecules/AdminPagination';
import styles from '../styles/AdminShared.module.css';

export const AdminCommunityListPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('communities');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = useCallback((p: number, size = pageSize) => {
    setError('');
    getCommunities(size, p * size)
      .then((data) => {
        setCommunities(data.communities.items);
        setTotal(data.communities.total);
        setPage(p);
      })
      .catch(() => setError('コミュニティ一覧の取得に失敗しました'));
  }, [pageSize]);

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0));
  }, [loadPage]);

  return (
    <div>
      <AdminHeader />
      <main className={styles.page}>
        <h1>コミュニティ一覧</h1>
        {error && <p className={styles.errorText}>{error}</p>}
        <div className={styles.listMetaRow}>
          <p className={styles.countText}>全 {total} 件</p>
          <AdminPageSizeSelect value={pageSize} onChange={setPageSize} />
        </div>
        <table className={styles.compactTable}>
          <thead>
            <tr>
              <th>名前</th>
              <th>説明</th>
              <th>作成日時</th>
            </tr>
          </thead>
          <tbody>
            {communities.map((community) => (
              <tr
                key={community.ID}
                onClick={() =>
                  navigate(`/admin/communities/${community.ID}`, { state: { community } })
                }
                className={styles.clickableRow}
              >
                <td>{community.name}</td>
                <td>{community.description}</td>
                <td>{community.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {communities.length === 0 && !error && <p>コミュニティが見つかりませんでした</p>}
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
