import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { searchUsers, type UserProfile } from '../api/profile';
import { getOrCreateDMRoom, listMyDMRooms } from '../api/message';
import { USER_ID_KEY } from '../api/auth';

type RecentDM = {
  roomID: string;
  partnerName: string;
  partnerAccountID: string;
};

export const DMListPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState<string | null>(null);
  const [recentDMs, setRecentDMs] = useState<RecentDM[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const loadDMRooms = async () => {
      const currentUserAccountID = localStorage.getItem(USER_ID_KEY);
      const isCurrentUser = (user: { ID: string; accountID: string }) => {
        if (!currentUserAccountID) return false;
        return user.ID === currentUserAccountID || user.accountID === currentUserAccountID;
      };

      try {
        const serverRooms = await listMyDMRooms();
        if (!active) return;

        const mappedRecent = serverRooms
          .map((room) => {
            const partner = room.user.find((u) => !isCurrentUser(u)) ?? room.user[0];
            if (!partner) return null;
            return {
              roomID: room.ID,
              partnerName: partner.name,
              partnerAccountID: partner.accountID,
            } as RecentDM;
          })
          .filter((dm): dm is RecentDM => dm !== null);

        setRecentDMs(mappedRecent);
      } catch {
        if (active) setError('DMルームの読み込みに失敗しました');
      }
    };

    void loadDMRooms();

    return () => {
      active = false;
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setSearched(false);
    try {
      const data = await searchUsers(query);
      const currentUserAccountID = localStorage.getItem(USER_ID_KEY);
      const filtered = currentUserAccountID
        ? data.searchUsers.filter((u) => u.ID !== currentUserAccountID)
        : data.searchUsers;
      setResults(filtered);
      setSearched(true);
    } catch {
      setError('検索に失敗しました');
    }
  };

  const handleStartDM = async (target: UserProfile) => {
    setStarting(target.ID);
    setError('');
    try {
      const data = await getOrCreateDMRoom(target.ID);
      navigate(`/dm/${data.getOrCreateDMRoom.ID}`);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : 'DMの開始に失敗しました';
      setError(message);
    } finally {
      setStarting(null);
    }
  };

  const handleOpenDM = (dm: RecentDM) => {
    navigate(`/dm/${dm.roomID}`);
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
                    <strong>{user.name}</strong>（{user.accountID}）
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
                  onClick={() => handleOpenDM(dm)}
                  style={{
                    cursor: 'pointer',
                    padding: '0.75rem 0.5rem',
                    borderBottom: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                >
                  <strong>{dm.partnerName}</strong>
                  <span style={{ color: '#888', marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                    @{dm.partnerAccountID}
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
