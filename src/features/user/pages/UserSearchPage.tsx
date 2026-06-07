import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchUsers, type UserProfile } from '../api/profile';
import { UserHeader } from '../components/organisms/UserHeader';
import { useAuth } from '../context/AuthContext';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './UserSearchPage.module.css';

export const UserSearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: currentUserID } = useAuth();

  const handleSearch = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    try {
      const data = await searchUsers(query);
      const filtered = currentUserID
        ? data.searchUsers.filter((u) => u.ID !== currentUserID)
        : data.searchUsers;
      setResults(filtered);
      setSearched(true);
    } catch (err) {
      setError(toUserMessage(err, 'ユーザーの検索に失敗しました。時間をおいてから再度お試しください。'));
    }
  };

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
        {searched && results.length === 0 && <p>該当するユーザーが見つかりませんでした</p>}

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
          </ul>
        )}
      </main>
    </div>
  );
};
