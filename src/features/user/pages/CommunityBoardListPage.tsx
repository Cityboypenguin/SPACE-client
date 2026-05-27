import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserHeader } from '../components/organisms/UserHeader';
import { CommunityBoard } from '../components/organisms/CommunityBoard';
import { searchCommunities, joinCommunity, listMyCommunities, getRandomCommunities, type Community } from '../api/community';
import { useAuth } from '../context/AuthContext';

export const CommunityBoardListPage = () => {
  const navigate = useNavigate();
  const { userId: currentUserID } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Community[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [joinedIDs, setJoinedIDs] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [randomResults, setRandomResults] = useState<Community[]>([]);
  const [loadingRandom, setLoadingRandom] = useState(false);

  // マウント時におすすめコミュニティを取得
  useEffect(() => {
    let active = true;
    setLoadingRandom(true);

    const initializeData = async () => {
      try {
        // 1. 自分が参加しているコミュニティの最新リストを取得
        // エラーの指摘通り、関数名を「myCommunities」に変更します
        const joinedList = await listMyCommunities(); 
        
        // 🌟 型の安全性を確保するため、<string> を明示します
        const myIDs = new Set<string>(joinedList.map((c: Community) => c.ID));
        
        if (!active) return;
        // 参加済み状態を最新に更新
        setJoinedIDs(myIDs);

        // 2. おすすめコミュニティを取得
        const randomList = await getRandomCommunities(10);
        
        if (!active) return;
        // 最新の参加済みIDを使って、画面を開いた時点のデータをフィルター除外
        const initialFiltered = randomList.filter((c) => !myIDs.has(c.ID));
        setRandomResults(initialFiltered);

      } catch (err) {
        console.error('データの初期化に失敗しました:', err);
      } finally {
        if (active) setLoadingRandom(false);
      }
    };

    initializeData();

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
    try {
      await joinCommunity(community.roomID);
      setJoinedIDs((prev) => new Set([...prev, community.ID]));
    } catch (err) {
      console.error('コミュニティへの参加に失敗しました:', err);
    }
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

        {!searched && (
          <div>
            <h2 style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '0.75rem' }}>おすすめのコミュニティ</h2>
            {loadingRandom ? (
              <p style={{ color: '#94a3b8' }}>読み込み中...</p>
            ) : randomResults.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>おすすめのコミュニティはありません</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {randomResults.map((c) => (
                  <CommunityBoard
                    key={c.ID}
                    community={c}
                    currentUserID={currentUserID}
                    joined={joinedIDs.has(c.ID)}
                    onJoin={handleJoin}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {searched && results.length === 0 && (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>
            該当するコミュニティが見つかりませんでした
          </p>
        )}

        {searched && results.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '0.75rem' }}>検索結果</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {results.map((c) => (
                <CommunityBoard
                  key={c.ID}
                  community={c}
                  currentUserID={currentUserID}
                  joined={joinedIDs.has(c.ID)}
                  onJoin={handleJoin}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};