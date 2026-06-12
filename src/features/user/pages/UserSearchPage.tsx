import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchUsers, type UserProfile } from '../api/profile';
import { UserHeader } from '../components/organisms/UserHeader';
import { useAuth } from '../context/AuthContext';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './UserSearchPage.module.css';

const LIMIT = 20;

export const UserSearchPage = () => {
  const [query, setQuery] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searched, setSearched] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: currentUserID } = useAuth();
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
      setOffset(currentOffset + page.items.length);
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
    setOffset(0);
    setSearched(true);
    setActiveKeyword(query);
    await loadMore(query, 0, true);
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !searched) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setOffset((prev) => {
            if (!loadingRef.current && prev < total) {
              loadMore(activeKeyword, prev, false);
            }
            return prev;
          });
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [searched, total, activeKeyword, loadMore]);

  return (
    <div>
      <UserHeader />
      <main className={styles.main}>
        <h1>ユーザー検索</h1>
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
