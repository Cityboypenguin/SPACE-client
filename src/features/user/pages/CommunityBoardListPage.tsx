import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserHeader } from '../components/organisms/UserHeader';
import { CommunityBoard } from '../components/organisms/CommunityBoard';
import { searchCommunities, joinCommunity, listMyCommunities, getRandomCommunities, type Community } from '../api/community';
import { createReport } from '../api/report';
import { useAuth } from '../context/AuthContext';
import { toUserMessage } from '../../../lib/errorMessages';

export const CommunityBoardListPage = () => {
  const navigate = useNavigate();
  const { userId: currentUserID } = useAuth();
  const [query, setQuery] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [results, setResults] = useState<Community[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchOffset, setSearchOffset] = useState(0);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: myCommunities, mutate: mutateMyCommunities } = useSWR('my-communities', listMyCommunities);
  const { data: randomCommunities, isLoading: loadingRandom } = useSWR(
    'random-communities',
    () => getRandomCommunities(10),
  );

  const joinedIDs = useMemo(
    () => new Set(myCommunities?.map((c) => c.ID) ?? []),
    [myCommunities],
  );

  const randomResults = useMemo(
    () => randomCommunities?.filter((c) => !joinedIDs.has(c.ID)) ?? [],
    [randomCommunities, joinedIDs],
  );

  const loadSearchResults = useCallback(async (keyword: string, currentOffset: number, isFirst: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!isFirst) setLoadingMore(true);
    try {
      const page = await searchCommunities(keyword, 20, currentOffset);
      setResults((prev) => isFirst ? page.items : [...prev, ...page.items]);
      setSearchTotal(page.total);
      setSearchOffset(currentOffset + page.items.length);
    } catch (err) {
      if (isFirst) setError(toUserMessage(err, 'コミュニティの検索に失敗しました。時間をおいてから再度お試しください。'));
    } finally {
      loadingRef.current = false;
      if (!isFirst) setLoadingMore(false);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSearching(true);
    setSearched(false);
    setResults([]);
    setSearchTotal(0);
    setSearchOffset(0);
    setActiveKeyword(query);
    try {
      await loadSearchResults(query, 0, true);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !searched) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSearchOffset((prev) => {
            if (!loadingRef.current && prev < searchTotal) {
              loadSearchResults(activeKeyword, prev, false);
            }
            return prev;
          });
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [searched, searchTotal, activeKeyword, loadSearchResults]);

  const handleReportCommunity = useCallback(async (community: Community) => {
    const customReason = window.prompt(
      `コミュニティ「${community.name}」を通報する具体的な理由を入力してください。`
    );

    if (customReason === null) return;
    if (customReason.trim() === '') {
      alert('通報には具体的な理由の入力が必要です。');
      return;
    }

    try {
      await createReport({
        targetType: 'COMMUNITY',
        targetID: community.ID,
        reason: 'COMMUNITY_VIOLATION',
        customReason: customReason,
      });
      alert('コミュニティの通報を送信しました。ご協力ありがとうございました。');
    } catch (err) {
      console.error('コミュニティの通報に失敗しました:', err);
      alert('通報の送信に失敗しました。時間をおいてから再度お試しください。');
    }
  }, []);

  const handleJoin = useCallback(async (community: Community) => {
    try {
      await joinCommunity(community.roomID);
      void mutateMyCommunities();
    } catch (err) {
      console.error('コミュニティへの参加に失敗しました:', err);
    }
  }, [mutateMyCommunities]);

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
                    onReport={handleReportCommunity}
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
                  onReport={handleReportCommunity}
                />
              ))}
            </div>
            <div ref={sentinelRef} style={{ height: '1px' }} />
            {loadingMore && (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '0.5rem' }}>読み込み中...</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
