import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { SearchBar } from '../components/molecules/SearchBar';
import { UnreadCountBadge } from '../../../components/atoms/UnreadCountBadge';
import { searchUsers, type UserProfile } from '../api/profile';
import { getOrCreateDMRoom, listMyDMRooms, type Room } from '../api/message';
import { useAuth } from '../context/AuthContext';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './DMListPage.module.css';

const LIMIT = 20;

export const DMListPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [starting, setStarting] = useState<string | null>(null);
  const navigate = useNavigate();
  const { userId: currentUserID } = useAuth();

  const [dmRooms, setDmRooms] = useState<Room[]>([]);
  const [dmTotal, setDmTotal] = useState(0);
  const [dmInitialLoading, setDmInitialLoading] = useState(true);
  const [dmLoadingMore, setDmLoadingMore] = useState(false);
  const [dmError, setDmError] = useState(false);
  const dmLoadingRef = useRef(false);

  const loadDMRooms = useCallback(async (currentOffset: number, isInitial: boolean) => {
    if (dmLoadingRef.current) return;
    dmLoadingRef.current = true;
    if (isInitial) setDmInitialLoading(true);
    else setDmLoadingMore(true);
    try {
      const page = await listMyDMRooms(LIMIT, currentOffset);
      setDmRooms((prev) => isInitial ? page.items : [...prev, ...page.items]);
      setDmTotal(page.total);
      setDmError(false);
    } catch {
      setDmError(true);
    } finally {
      dmLoadingRef.current = false;
      if (isInitial) setDmInitialLoading(false);
      else setDmLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadDMRooms(0, true);
  }, [loadDMRooms]);

  const sentinelRef = useInfiniteScroll(
    useCallback(() => {
      setDmRooms((prev) => {
        if (!dmLoadingRef.current && prev.length < dmTotal) loadDMRooms(prev.length, false);
        return prev;
      });
    }, [dmTotal, loadDMRooms]),
    dmLoadingMore,
  );

  useUnreadSubscription(({ roomID, unreadCount }) => {
    setDmRooms((prev) =>
      prev.map((room) => room.ID === roomID ? { ...room, unreadCount } : room),
    );
  });

  const handleSearch = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSearchError('');
    setResults([]);
    setSearched(false);
    try {
      const page = await searchUsers(query);
      const filtered = currentUserID
        ? page.items.filter((u) => u.ID !== currentUserID)
        : page.items;
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
      <UserSidebar />
      <main className={styles.main}>
        <h1>ダイレクトメッセージ</h1>

        <section>
          <h2 className={styles.sectionTitle}>新しいDMを開始</h2>
          <SearchBar value={query} onChange={setQuery} onSubmit={handleSearch} />

          {(searchError || dmError) && (
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

        {dmInitialLoading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '1rem' }}>読み込み中...</p>
        ) : dmRooms.length > 0 && (
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
            <div ref={sentinelRef} style={{ height: '1px' }} />
            {dmLoadingMore && (
              <p style={{ color: '#94a3b8', padding: '0.5rem', textAlign: 'center' }}>読み込み中...</p>
            )}
            {!dmLoadingMore && dmRooms.length >= dmTotal && dmTotal > 0 && (
              <p style={{ color: '#94a3b8', padding: '0.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                すべてのDMを表示しました
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
