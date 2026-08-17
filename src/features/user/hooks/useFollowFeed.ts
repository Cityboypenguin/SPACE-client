import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getFollowersTopLevelPosts, type Post } from '../api/post';

const LIMIT = 20;

export type FeedLoadMode = 'initial' | 'refresh' | 'more';

// useFollowFeed はフォロー中ユーザーのタイムライン取得・ページングの状態を
// ページコンポーネントから切り出したデータフック。
// PostListPage が抱えていた6つの state/ref と読み込みロジックをここへ集約し、
// 画面側はUI表示に専念できるようにする（データ取得と描画の分離）。
export const useFollowFeed = (userId: string | null) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // 最新値を同期的に参照するための ref（無限スクロール等の非同期コールバック用）。
  const loadingRef = useRef(false);
  const postsRef = useRef<Post[]>([]);
  const totalRef = useRef(0);
  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => { totalRef.current = total; }, [total]);

  const load = useCallback(async (offset: number, mode: FeedLoadMode) => {
    if (!userId || loadingRef.current) return;
    loadingRef.current = true;
    if (mode === 'initial' || mode === 'refresh') setInitialLoading(true);
    else setLoadingMore(true);
    try {
      const result = await getFollowersTopLevelPosts(userId, LIMIT, offset);
      setPosts(prev => {
        if (mode === 'initial' || mode === 'refresh') return result.items;
        const fetchedMap = new Map(result.items.map(p => [p.ID, p]));
        const prevIds = new Set(prev.map(p => p.ID));
        const updated = prev.map(p => fetchedMap.get(p.ID) ?? p);
        const newItems = result.items.filter(p => !prevIds.has(p.ID));
        return [...updated, ...newItems];
      });
      setTotal(result.total);
    } catch {
      /* フォローフィードの取得失敗は致命的でないため無視（再試行はページ操作で発生する） */
    } finally {
      loadingRef.current = false;
      if (mode === 'initial' || mode === 'refresh') setInitialLoading(false);
      else setLoadingMore(false);
    }
  }, [userId]);

  // タブ初回表示時などに、未ロードなら一度だけ読み込む（多重ロードは ref で抑止）。
  const ensureLoaded = useCallback(() => {
    if (postsRef.current.length === 0 && !loadingRef.current) {
      load(0, 'initial');
    }
  }, [load]);

  // 無限スクロールから呼ぶ追加読み込み（末尾に達していなければ次ページ）。
  const loadMore = useCallback(() => {
    if (!loadingRef.current && postsRef.current.length < totalRef.current) {
      load(postsRef.current.length, 'more');
    }
  }, [load]);

  // 楽観的更新（いいね/編集などで該当投稿だけ差し替え）。
  const updatePost = useCallback((postId: string, updater: (p: Post) => Post) => {
    setPosts(prev => prev.map(p => (p.ID === postId ? updater(p) : p)));
  }, []);

  // 楽観的削除。
  const removePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.ID !== postId));
  }, []);

  // 返り値をメモ化し、データが変わらない再レンダーでオブジェクト同一性を保つ
  // （関数は useCallback で安定なので、依存は state 値のみ）。これにより
  // 呼び出し側の useEffect/useCallback が毎回再生成されるのを防ぐ。
  return useMemo(
    () => ({ posts, total, initialLoading, loadingMore, load, ensureLoaded, loadMore, updatePost, removePost }),
    [posts, total, initialLoading, loadingMore, load, ensureLoaded, loadMore, updatePost, removePost],
  );
};
