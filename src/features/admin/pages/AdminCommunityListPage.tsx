import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunities, type Community } from '../api/communities';
import { AdminHeader } from '../components/organisms/AdminHeader';

const PAGE_SIZE = 20;

export const AdminCommunityListPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const loadPage = (p: number) => {
    setError('');
    getCommunities(PAGE_SIZE, p * PAGE_SIZE)
      .then((data) => {
        setCommunities(data.communities.items);
        setTotal(data.communities.total);
        setPage(p);
      })
      .catch(() => setError('コミュニティ一覧の取得に失敗しました'));
  };

  useEffect(() => {
    loadPage(0);
  }, []);

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <h1>コミュニティ一覧</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>全 {total} 件</p>
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
