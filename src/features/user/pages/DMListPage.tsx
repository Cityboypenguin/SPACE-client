import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { searchUsers, type UserProfile } from '../api/profile';
import { getOrCreateDMRoom, listMyDMRooms } from '../api/message';
import { useAuth } from '../context/AuthContext';
import styles from './DMListPage.module.css';

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
  const { userId: currentUserID } = useAuth();

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
            return { roomID: room.ID, partnerName: partner.name, partnerUserID: partner.userID } as RecentDM;
          })
          .filter((dm): dm is RecentDM => dm !== null);

        setRecentDMs(mappedRecent);
      } catch {
        if (active) setError('DMルームの読み込みに失敗しました');
      }
    };

    void loadDMRooms();
    return () => { active = false; };
  }, [currentUserID]);

  const handleSearch = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setSearched(false);
    try {
      const data = await searchUsers(query);
      const currentUserAccountID = localStorage.getItem(USER_ID_KEY);
      const filtered = currentUserAccountID
        ? data.searchUsers.filter((u) => u.ID !== currentUserAccountID)
      const filtered = currentUserID
        ? data.searchUsers.filter((u) => u.ID !== currentUserID)
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
      setError(err instanceof Error && err.message ? err.message : 'DMの開始に失敗しました');
    } finally {
      setStarting(null);
    }
  };

  return (
    <div>
      <UserHeader />
      <main className={styles.main}>
        <h1>ダイレクトメッセージ</h1>

        <section>
          <h2 className={styles.sectionTitle}>新しいDMを開始</h2>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="名前で検索"
              required
              className={styles.searchInput}
            />
            <button type="submit">検索</button>
          </form>

          {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
          {searched && results.length === 0 && (
            <p style={{ marginTop: '0.5rem' }}>該当するユーザーが見つかりませんでした</p>
          )}

          {results.length > 0 && (
            <ul className={styles.resultList}>
              {results.map((user) => (
                <li key={user.ID} className={styles.resultItem}>
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
          <section className={styles.dmSection}>
            <h2 className={styles.sectionTitle}>最近のDM</h2>
            <ul className={styles.dmList}>
              {recentDMs.map((dm) => (
                <li
                  key={dm.roomID}
                  onClick={() => navigate(`/dm/${dm.roomID}`)}
                  className={styles.dmItem}
                >
                  <strong>{dm.partnerName}</strong>
                  <span style={{ color: '#888', marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                    @{dm.partnerAccountID}
                  </span>
                  <span className={styles.dmPartnerSub}>@{dm.partnerUserID}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};
