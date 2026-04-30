import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchUsers, type UserProfile } from '../api/profile';
import { UserHeader } from '../components/UserHeader';
import { USER_ID_KEY } from '../api/auth';

export const UserSearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    try {
      const data = await searchUsers(query);
      const currentUserID = localStorage.getItem(USER_ID_KEY);
      const filtered = currentUserID
        ? data.searchUsers.filter((u) => u.ID !== currentUserID && u.accountID !== currentUserID)
        : data.searchUsers;
      setResults(filtered);
      setSearched(true);
    } catch {
      setError('検索に失敗しました');
    }
  };

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem' }}>
        <h1>ユーザー検索</h1>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前で検索"
            required
          />
          <button type="submit">検索</button>
        </form>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {searched && results.length === 0 && (
          <p>該当するユーザーが見つかりませんでした</p>
        )}

        {results.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {results.map((user) => (
              <li
                key={user.ID}
                onClick={() => navigate(`/users/${user.ID}`)}
                style={{ cursor: 'pointer', padding: '0.5rem 0', borderBottom: '1px solid #ccc' }}
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
