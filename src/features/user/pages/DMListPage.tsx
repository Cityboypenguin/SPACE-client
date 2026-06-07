import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserHeader } from '../components/organisms/UserHeader';
import { UnreadCountBadge } from '../../../components/atoms/UnreadCountBadge';
import { searchUsers, type UserProfile } from '../api/profile';
import { getOrCreateDMRoom, listMyDMRooms } from '../api/message';
import { useAuth } from '../context/AuthContext';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './DMListPage.module.css';

export const DMListPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [starting, setStarting] = useState<string | null>(null);
  const navigate = useNavigate();
  const { userId: currentUserID } = useAuth();

  const { data: dmRooms, error: roomsError, mutate: mutateDmRooms } = useSWR(
    'dm-rooms',
    listMyDMRooms,
  );

  useUnreadSubscription(({ roomID, unreadCount }) => {
    mutateDmRooms(
      (prev) => prev?.map((room) => room.ID === roomID ? { ...room, unreadCount } : room),
      { revalidate: false },
    );
  });

  const handleSearch = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSearchError('');
    setResults([]);
    setSearched(false);
    try {
      const data = await searchUsers(query);
      const filtered = currentUserID
        ? data.searchUsers.filter((u) => u.ID !== currentUserID)
        : data.searchUsers;
      setResults(filtered);
      setSearched(true);
    } catch (err) {
      setSearchError(toUserMessage(err, '検索に失敗しました。時間をおいてから再度お試しください。'));
    }
  };

  const handleStartDM = async (target: UserProfile) => {
    setStarting(target.ID);
    setSearchError('');
    try {
      const data = await getOrCreateDMRoom(target.ID);
      navigate(`/dm/${data.getOrCreateDMRoom.ID}`);
    } catch (err) {
      setSearchError(toUserMessage(err, 'DMの開始に失敗しました。時間をおいてから再度お試しください。'));
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

          {(searchError || roomsError) && (
            <p style={{ color: 'red', marginTop: '0.5rem' }}>
              {searchError || 'DMルームの読み込みに失敗しました。'}
            </p>
          )}
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

        {dmRooms && dmRooms.length > 0 && (
          <section className={styles.dmSection}>
            <h2 className={styles.sectionTitle}>最近のDM</h2>
            <ul className={styles.dmList}>
              {dmRooms.map((room) => {
                const partner = room.user.find((u) => u.ID !== currentUserID) ?? room.user[0];
                if (!partner) return null;
                const hasUnread = (room.unreadCount ?? 0) > 0;
                return (
                  <li
                    key={room.ID}
                    onClick={() => navigate(`/dm/${room.ID}`)}
                    className={`${styles.dmItem} ${hasUnread ? styles.dmItemUnread : ''}`}
                  >
                    <div className={styles.dmItemContent}>
                      <strong>{partner.name}</strong>
                      <span className={styles.dmPartnerSub}>@{partner.accountID}</span>
                    </div>
                    <UnreadCountBadge count={room.unreadCount ?? 0} />
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};
