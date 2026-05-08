import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCommunities, type Community } from '../api/communities';
import { AdminHeader } from '../components/AdminHeader';

export const AdminCommunityListPage = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getCommunities()
      .then((data) => setCommunities(data.communities))
      .catch(() => setError('コミュニティ一覧の取得に失敗しました'));
  }, []);

  return (
    <div>
      <AdminHeader />
      <main style={{ padding: '2rem' }}>
        <h1>コミュニティ一覧</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
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
      </main>
    </div>
  );
};
