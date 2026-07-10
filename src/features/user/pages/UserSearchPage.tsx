import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchUsers, getProfileByUserID, type UserProfile } from '../api/profile';
import {
  searchPosts, searchPostsByHashtag, createPost, createFavorite, deleteFavorite, getPostByID,
  type Post,
} from '../api/post';
import { uploadMediaFiles } from '../api/media';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { PostCard } from '../components/organisms/PostCard';
import { ReplyModal } from '../components/organisms/ReplyModal';
import { Avatar } from '../../../components/atoms/Avatar';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { storageUrl } from '../../../lib/storage';
import searchIconSvg from '../../../assets/パーツ_検索.svg';
import styles from './UserSearchPage.module.css';

type Mode = 'user' | 'post';
const LIMIT = 20;

// 検索ボックスが "#タグ" 始まりならハッシュタグ完全一致検索とみなす。
// マッチしたときの [1] がタグ本体（最初の空白まで）。
const HASHTAG_QUERY_REGEX = /^#(\S+)/;

function loadRecent<T>(mode: Mode): T[] {
  try { return JSON.parse(localStorage.getItem(`search-recent-${mode}`) ?? '[]'); }
  catch { return []; }
}

function addToRecent<T extends { ID: string }>(mode: Mode, item: T): T[] {
  const current = loadRecent<T>(mode);
  const next = [item, ...current.filter(x => x.ID !== item.ID)].slice(0, 20);
  localStorage.setItem(`search-recent-${mode}`, JSON.stringify(next));
  return next;
}

function uniqueByID<T extends { ID: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.ID)) return false;
    seen.add(item.ID);
    return true;
  });
}

export const UserSearchPage = () => {
  const [mode, setMode] = useState<Mode>(() => {
    const stored = sessionStorage.getItem('search-mode');
    return stored === 'post' ? 'post' : 'user';
  });
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [searched, setSearched] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userLoadedCount, setUserLoadedCount] = useState(0);
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>(() => uniqueByID(loadRecent<UserProfile>('user')));

  const [allPostResults, setAllPostResults] = useState<Post[]>([]);
  const [postDisplayedCount, setPostDisplayedCount] = useState(LIMIT);
  const [postLoading, setPostLoading] = useState(false);
  const [recentPosts, setRecentPosts] = useState<Post[]>(() => loadRecent<Post>('post'));

  const [replyingTo, setReplyingTo] = useState<Post | null>(null);

  const loadingRef = useRef(false);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: currentUserId } = useAuth();
  const { profile } = useProfile(currentUserId);

  useEffect(() => {
    if (recentUsers.length === 0) return;
    let cancelled = false;
    (async () => {
      const checks = await Promise.all(
        recentUsers.map(async (u) => {
          try { await getProfileByUserID(u.ID); return true; }
          catch { return false; }
        }),
      );
      if (cancelled) return;
      const valid = recentUsers.filter((_, i) => checks[i]);
      if (valid.length !== recentUsers.length) {
        setRecentUsers(valid);
        localStorage.setItem('search-recent-user', JSON.stringify(valid));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recentPosts.length === 0) return;
    let cancelled = false;
    (async () => {
      const checks = await Promise.all(
        recentPosts.map(async (p) => {
          try { return (await getPostByID(p.ID)) !== null; }
          catch { return false; }
        }),
      );
      if (cancelled) return;
      const valid = recentPosts.filter((_, i) => checks[i]);
      if (valid.length !== recentPosts.length) {
        setRecentPosts(valid);
        localStorage.setItem('search-recent-post', JSON.stringify(valid));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!modeMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [modeMenuOpen]);

  const loadMoreUsers = useCallback(async (keyword: string, offset: number, isFirst: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!isFirst) setLoadingMore(true);
    try {
      const page = await searchUsers(keyword, LIMIT, offset);
      const filtered = currentUserId ? page.items.filter(u => u.ID !== currentUserId) : page.items;
      setUserResults(prev => uniqueByID(isFirst ? filtered : [...prev, ...filtered]));
      setUserTotal(page.total);
      setUserLoadedCount(prev => isFirst ? page.items.length : prev + page.items.length);
    } catch { /* noop */ } finally {
      loadingRef.current = false;
      if (!isFirst) setLoadingMore(false);
    }
  }, [currentUserId]);

  const runPostSearch = useCallback(async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    setAllPostResults([]);
    setPostDisplayedCount(LIMIT);
    setPostLoading(true);
    try {
      const hashtagMatch = trimmed.match(HASHTAG_QUERY_REGEX);
      const posts = hashtagMatch
        ? await searchPostsByHashtag(hashtagMatch[1])
        : await searchPosts(trimmed);
      setAllPostResults(posts);
    } catch { /* noop */ } finally {
      setPostLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearched(true);
    setActiveKeyword(query);

    if (mode === 'user') {
      setUserResults([]);
      setUserTotal(0);
      setUserLoadedCount(0);
      await loadMoreUsers(query, 0, true);
    } else {
      await runPostSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearched(false);
    setUserResults([]);
    setAllPostResults([]);
    setPostDisplayedCount(LIMIT);
    setActiveKeyword('');
    setUserTotal(0);
    setUserLoadedCount(0);
  };

  const switchMode = (next: Mode) => {
    sessionStorage.setItem('search-mode', next);
    setMode(next);
    setModeMenuOpen(false);
    setSearched(false);
    setQuery('');
    setUserResults([]);
    setAllPostResults([]);
    setPostDisplayedCount(LIMIT);
    setActiveKeyword('');
    setUserTotal(0);
    setUserLoadedCount(0);
  };

  const userSentinelRef = useInfiniteScroll(
    useCallback(() => {
      if (!loadingRef.current && userLoadedCount < userTotal && activeKeyword) {
        void loadMoreUsers(activeKeyword, userLoadedCount, false);
      }
    }, [userLoadedCount, userTotal, activeKeyword, loadMoreUsers]),
    loadingMore,
    searched && mode === 'user',
  );

  const postSentinelRef = useInfiniteScroll(
    useCallback(() => {
      setPostDisplayedCount(prev => prev + LIMIT);
    }, []),
    false,
    searched && mode === 'post' && postDisplayedCount < allPostResults.length,
  );

  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) await deleteFavorite(postId);
      else await createFavorite(postId);
      const applyUpdate = (posts: Post[]) => posts.map(p => {
        if (p.ID !== postId) return p;
        return isLiked
          ? { ...p, favorites: p.favorites.filter(f => f.user.ID !== currentUserId) }
          : { ...p, favorites: [...p.favorites, { ID: 'tmp', user: { ID: currentUserId ?? '' } }] };
      });
      setAllPostResults(prev => applyUpdate(prev));
      setRecentPosts(prev => {
        const next = applyUpdate(prev);
        localStorage.setItem('search-recent-post', JSON.stringify(next));
        return next;
      });
    } catch { /* noop */ }
  }, [currentUserId]);

  const handleReplySubmit = useCallback(async (content: string, files: File[]) => {
    if (!replyingTo) return;
    const mediaInputs = await uploadMediaFiles(files);
    await createPost(content.trim(), replyingTo.ID, mediaInputs);
    const applyReply = (posts: Post[]) =>
      posts.map(p => p.ID === replyingTo.ID ? { ...p, replyCount: p.replyCount + 1 } : p);
    setAllPostResults(prev => applyReply(prev));
    setRecentPosts(prev => {
      const next = applyReply(prev);
      localStorage.setItem('search-recent-post', JSON.stringify(next));
      return next;
    });
  }, [replyingTo]);

  const displayedUsers = searched ? userResults : recentUsers;
  const displayedPosts = searched ? allPostResults.slice(0, postDisplayedCount) : recentPosts;
  const showRecent = !searched && (mode === 'user' ? recentUsers.length > 0 : recentPosts.length > 0);

  return (
    <div>
      <UserSidebar />
      {replyingTo && (
        <ReplyModal
          post={replyingTo}
          onClose={() => setReplyingTo(null)}
          onSubmit={handleReplySubmit}
          userId={currentUserId}
          avatarUrl={profile?.avatarUrl}
          userName={profile?.user.name}
        />
      )}
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.modeWrap} ref={modeMenuRef}>
            <button className={styles.modeButton} onClick={() => setModeMenuOpen(v => !v)}>
              {mode === 'user' ? 'ユーザー検索' : '投稿検索'}
              <span className={styles.modeArrow}>▼</span>
            </button>
            {modeMenuOpen && (
              <div className={styles.modeDropdown}>
                <button
                  className={`${styles.modeOption}${mode === 'user' ? ` ${styles.modeOptionActive}` : ''}`}
                  onClick={() => switchMode('user')}
                >
                  ユーザー検索
                </button>
                <button
                  className={`${styles.modeOption}${mode === 'post' ? ` ${styles.modeOptionActive}` : ''}`}
                  onClick={() => switchMode('post')}
                >
                  投稿検索
                </button>
              </div>
            )}
          </div>
        </div>

        <form className={styles.searchForm} onSubmit={e => { e.preventDefault(); void handleSearch(); }}>
          <div className={styles.searchBar}>
            <img src={searchIconSvg} alt="" className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className={styles.clearButton} onClick={handleClear}>
                ×
              </button>
            )}
          </div>
        </form>

        {showRecent && <p className={styles.sectionLabel}>最近</p>}

        {mode === 'user' ? (
          displayedUsers.length > 0 ? (
            <>
              <div className={styles.userList}>
                {displayedUsers.map(user => (
                  <div
                    key={user.ID}
                    className={styles.userItem}
                    onClick={() => {
                      const next = addToRecent<UserProfile>('user', user);
                      setRecentUsers(next);
                      navigate(`/users/${user.ID}`, { state: { from: location.pathname } });
                    }}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={storageUrl(user.avatarUrl) ?? undefined}
                        alt={user.name}
                        className={styles.userAvatar}
                      />
                    ) : (
                      <div className={styles.userAvatarWrap}>
                        <Avatar name={user.name} size={48} />
                      </div>
                    )}
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userAccountID}>@{user.accountID}</span>
                  </div>
                ))}
              </div>
              {searched && (
                <>
                  <div ref={userSentinelRef} style={{ height: '1px' }} />
                  {loadingMore && <p className={styles.loadingText}>読み込み中...</p>}
                </>
              )}
            </>
          ) : searched ? (
            <p className={styles.emptyText}>該当するユーザーが見つかりませんでした</p>
          ) : null
        ) : postLoading ? (
          <p className={styles.loadingText}>読み込み中...</p>
        ) : displayedPosts.length > 0 ? (
          <>
            <div>
              {displayedPosts.map(post => (
                <PostCard
                  key={post.ID}
                  post={post}
                  currentUserId={currentUserId ?? null}
                  onLike={handleLike}
                  onReply={() => setReplyingTo(post)}
                  onClick={() => {
                    const next = addToRecent<Post>('post', post);
                    setRecentPosts(next);
                    navigate(`/posts/${post.ID}`);
                  }}
                />
              ))}
            </div>
            {searched && <div ref={postSentinelRef} style={{ height: '1px' }} />}
          </>
        ) : searched ? (
          <p className={styles.emptyText}>該当する投稿が見つかりませんでした</p>
        ) : null}
      </main>
    </div>
  );
};
