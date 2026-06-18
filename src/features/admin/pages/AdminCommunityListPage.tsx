import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunities, type Community } from '../api/communities';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { usePersistedPageSize } from '../hooks/usePersistedPageSize';

export const AdminCommunityListPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = usePersistedPageSize('communities');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / pageSize);

  const loadPage = (p: number, size = pageSize) => {
    setError('');
    getCommunities(size, p * size)
      .then((data) => {
        setCommunities(data.communities.items);
        setTotal(data.communities.total);
        setPage(p);
      })
      .catch(() => setError('コミュニティ一覧の取得に失敗しました'));
  };

  useEffect(() => {
    loadPage(0);
  }, [pageSize]);

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <h1>コミュニティ一覧</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>全 {total} 件</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
            表示件数
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '0.25rem 0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}件</option>)}
            </select>
          </label>
        </div>
        <table>
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
                style={{ cursor: 'pointer' }}
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
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => loadPage(page - 1)} disabled={page === 0}>前へ</button>
            <span>{page + 1} / {totalPages}</span>
            <button onClick={() => loadPage(page + 1)} disabled={page >= totalPages - 1}>次へ</button>
          </div>
        )}
      </main>
    </div>
  );
};
