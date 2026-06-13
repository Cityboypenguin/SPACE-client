import { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchUsers, type UserProfile } from '../api/profile';
import { UserHeader } from '../components/organisms/UserHeader';
import { SearchBar } from '../components/molecules/SearchBar';
import { useAuth } from '../context/AuthContext';
import { toUserMessage } from '../../../lib/errorMessages';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import styles from './UserSearchPage.module.css';

const LIMIT = 20;

export const UserSearchPage = () => {
  const [query, setQuery] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: currentUserID } = useAuth();
  const loadingRef = useRef(false);

  const loadMore = useCallback(async (keyword: string, currentOffset: number, isFirst: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!isFirst) setLoadingMore(true);
    try {
      const page = await searchUsers(keyword, LIMIT, currentOffset);
      const filtered = currentUserID
        ? page.items.filter((u) => u.ID !== currentUserID)
        : page.items;
      setResults((prev) => isFirst ? filtered : [...prev, ...filtered]);
      setTotal(page.total);
    } catch (err) {
      setError(toUserMessage(err, 'ユーザーの検索に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      loadingRef.current = false;
      if (!isFirst) setLoadingMore(false);
    }
  }, [currentUserID]);

  const handleSearch = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setTotal(0);
    setSearched(true);
    setActiveKeyword(query);
    await loadMore(query, 0, true);
  };

  const sentinelRef = useInfiniteScroll(
    useCallback(() => {
      setResults((prev) => {
        if (!loadingRef.current && prev.length < total) loadMore(activeKeyword, prev.length, false);
        return prev;
      });
    }, [total, activeKeyword, loadMore]),
    loadingMore,
    searched,
  );

  return (
    <div>
      <UserHeader />
      <main className={styles.main}>
        <h1>ユーザー検索</h1>
        <SearchBar value={query} onChange={setQuery} onSubmit={handleSearch} />

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {searched && results.length === 0 && !loadingRef.current && <p>該当するユーザーが見つかりませんでした</p>}

        {results.length > 0 && (
          <ul className={styles.resultList}>
            {results.map((user) => (
              <li
                key={user.ID}
                onClick={() => navigate(`/users/${user.ID}`, { state: { from: location.pathname } })}
                className={styles.resultItem}
              >
                <strong>{user.name}</strong>（{user.accountID}）
              </li>
            ))}
            <div ref={sentinelRef} style={{ height: '1px' }} />
          </ul>
        )}
        {loadingMore && <p style={{ textAlign: 'center', color: '#94a3b8' }}>読み込み中...</p>}
      </main>
    </div>
  );
};
