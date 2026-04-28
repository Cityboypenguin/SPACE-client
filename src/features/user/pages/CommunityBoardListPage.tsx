import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/UserHeader';
import { CommunityBoard } from '../components/CommunityBoard';
import { searchCommunities, joinCommunity, listMyCommunities, type Community } from '../api/community';

export const CommunityBoardListPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Community[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [joinedIDs, setJoinedIDs] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  // マウント時に参加済みコミュニティ ID を取得して初期化
  useEffect(() => {
    let active = true;
    listMyCommunities()
      .then((list) => {
        if (!active) return;
        setJoinedIDs(new Set(list.map((c) => c.ID)));
      })
      .catch(() => {/* 取得失敗は無視してゲスト扱いのまま続行 */});
    return () => { active = false; };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSearching(true);
    setSearched(false);
    try {
      const data = await searchCommunities(query);
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索に失敗しました');
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = useCallback(async (community: Community) => {
    await joinCommunity(community.roomID);
    setJoinedIDs((prev) => new Set([...prev, community.ID]));
  }, []);

  return (
    <div>
      <UserHeader />
      <main style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('/community')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#646cff', fontWeight: 600, padding: 0 }}
          >
            ← 戻る
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>コミュニティを探す</h1>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="コミュニティ名で検索"
            style={{ flex: 1, padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              background: searching || !query.trim() ? '#94a3b8' : '#646cff',
              color: '#fff',
              border: 'none',
              cursor: searching || !query.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {searching ? '検索中...' : '検索'}
          </button>
        </form>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        {searched && results.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>
            該当するコミュニティが見つかりませんでした
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {results.map((c) => (
            <CommunityBoard
              key={c.ID}
              community={c}
              onJoin={joinedIDs.has(c.ID) ? undefined : handleJoin}
              joined={joinedIDs.has(c.ID)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};
