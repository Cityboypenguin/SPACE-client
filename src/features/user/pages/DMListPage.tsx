import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { searchUsers, type UserProfile } from '../api/profile';
import { getOrCreateDMRoom } from '../api/message';
import { USER_ID_KEY } from '../api/auth';
import { getRecentDMs, saveRecentDM, type RecentDM } from '../utils/recentDM';

export const DMListPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState<string | null>(null);
  const [recentDMs] = useState<RecentDM[]>(getRecentDMs);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await searchUsers(query);
      setResults(data.searchUsers);
      setSearched(true);
    } catch {
      setError('検索に失敗しました');
    }
  };

  const handleStartDM = async (target: UserProfile) => {
    const currentUserID = localStorage.getItem(USER_ID_KEY);
    if (!currentUserID) return;
    setStarting(target.ID);
    setError('');
    try {
      const data = await getOrCreateDMRoom(currentUserID, target.ID);
      const room = data.getOrCreateDMRoom;
      saveRecentDM({ roomID: room.ID, partnerName: target.name, partnerUserID: target.userID });
      navigate(`/dm/${room.ID}`);
    } catch {
      setError('DMの開始に失敗しました');
    } finally {
      setStarting(null);
    }
  };

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>ダイレクトメッセージ</h1>

        <section>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>新しいDMを開始</h2>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="名前で検索"
              required
              style={{ flex: 1 }}
            />
            <button type="submit">検索</button>
          </form>

          {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}

          {searched && results.length === 0 && (
            <p style={{ marginTop: '0.5rem' }}>該当するユーザーが見つかりませんでした</p>
          )}

          {results.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
              {results.map((user) => (
                <li
                  key={user.ID}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #ccc',
                  }}
                >
                  <span>
                    <strong>{user.name}</strong>（{user.userID}）
                  </span>
                  <button
                    onClick={() => handleStartDM(user)}
                    disabled={starting === user.ID}
                    style={{ cursor: 'pointer' }}
                  >
                    {starting === user.ID ? '開始中...' : 'DMを開始'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {recentDMs.length > 0 && (
          <section style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>最近のDM</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {recentDMs.map((dm) => (
                <li
                  key={dm.roomID}
                  onClick={() => navigate(`/dm/${dm.roomID}`)}
                  style={{
                    cursor: 'pointer',
                    padding: '0.75rem 0.5rem',
                    borderBottom: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                >
                  <strong>{dm.partnerName}</strong>
                  <span style={{ color: '#888', marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                    @{dm.partnerUserID}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};
