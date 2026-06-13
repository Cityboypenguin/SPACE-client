import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { UserHeader } from '../components/organisms/UserHeader';
import { SearchBar } from '../components/molecules/SearchBar';
import { CommunityBoard } from '../components/organisms/CommunityBoard';
import { searchCommunities, joinCommunity, listMyCommunities, getRandomCommunities, type Community } from '../api/community';
import { useAuth } from '../context/AuthContext';
import { toUserMessage } from '../../../lib/errorMessages';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { ReportModal } from '../components/organisms/ReportMadal';

export const CommunityBoardListPage = () => {
  const navigate = useNavigate();
  const { userId: currentUserID } = useAuth();
  const [reportTarget, setReportTarget] = useState<Community | null>(null);
  const [query, setQuery] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [results, setResults] = useState<Community[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [, setSearchOffset] = useState(0);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const loadingRef = useRef(false);

  const { data: myCommunities, mutate: mutateMyCommunities } = useSWR('my-communities', () => listMyCommunities());
  const { data: randomCommunities, isLoading: loadingRandom } = useSWR(
    'random-communities',
    () => getRandomCommunities(10),
  );

  const joinedIDs = useMemo(
    () => new Set(myCommunities?.items.map((c) => c.ID) ?? []),
    [myCommunities],
  );

  const randomResults = useMemo(
    () => randomCommunities ?? [],
    [randomCommunities],
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

  const sentinelRef = useInfiniteScroll(
    useCallback(() => {
      setSearchOffset((prev) => {
        if (!loadingRef.current && prev < searchTotal) loadSearchResults(activeKeyword, prev, false);
        return prev;
      });
    }, [searchTotal, activeKeyword, loadSearchResults]),
    loadingMore,
    searched,
  );

  const handleReportCommunity = useCallback((community: Community) => {
    setReportTarget(community);
  }, []);

  const handleJoin = useCallback(async (community: Community) => {
    try {
      await joinCommunity(community.roomID);
      const joinedCommunity = {
        ...community,
        isMember: true,
        memberCount: (community.memberCount ?? 0) + 1,
      };
      setResults((prev) => prev.map((c) => c.ID === community.ID ? joinedCommunity : c));
      await mutateMyCommunities((current) => {
        if (!current) return current;
        if (current.items.some((c) => c.ID === community.ID)) return current;
        return {
          ...current,
          items: [joinedCommunity, ...current.items],
          total: current.total + 1,
        };
      }, { revalidate: true });
    } catch (err) {
      console.error('コミュニティへの参加に失敗しました:', err);
      throw err;
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

        <div style={{ marginBottom: '1.5rem' }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            placeholder="コミュニティ名で検索"
            submitting={searching}
          />
        </div>

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
                    joined={c.isMember || joinedIDs.has(c.ID)}
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
                  joined={c.isMember || joinedIDs.has(c.ID)}
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

      {reportTarget && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          targetType="COMMUNITY"
          targetID={reportTarget.ID}
        />
      )}
    </div>
  );
};
