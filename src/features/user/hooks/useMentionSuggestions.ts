import { useEffect, useMemo, useRef, useState } from 'react';
import { suggestUsers, type UserSuggestion } from '../api/post';
import { listFavoriteUsers } from '../api/favorite_user';

const SUGGEST_LIMIT = 8;
const DEBOUNCE_MS = 250;
// 先読みするお気に入り（フォロー中）ユーザーの上限。これを超える場合はサーバー補完に頼る。
const PRELOAD_LIMIT = 200;

// 先読み（お気に入りユーザー）はセッション内で1回だけ取得し、全フックで共有する。
// ハッシュタグの人気タグ先読み（useHashtagSuggestions）と同じ構造。
type Preload = { items: UserSuggestion[]; complete: boolean };
let preloadPromise: Promise<Preload> | null = null;

// サーバー結果のキャッシュ（プレフィックス -> 結果）。モジュールレベルで全フック共有。
const serverCache = new Map<string, UserSuggestion[]>();

function loadPreload(): Promise<Preload> {
  if (!preloadPromise) {
    preloadPromise = listFavoriteUsers(PRELOAD_LIMIT, 0)
      .then((r) => ({ items: r.items, complete: r.total <= r.items.length }))
      .catch((err) => {
        // 失敗時は次回再取得できるようにキャッシュを破棄する。
        preloadPromise = null;
        throw err;
      });
  }
  return preloadPromise;
}

function dedupeByID(list: UserSuggestion[]): UserSuggestion[] {
  const seen = new Set<string>();
  const out: UserSuggestion[] = [];
  for (const s of list) {
    if (seen.has(s.ID)) continue;
    seen.add(s.ID);
    out.push(s);
  }
  return out;
}

/**
 * 入力中の "@accountID" の本体(query)に対するサジェスト候補を返す。
 * - query が null のとき（メンション入力中でない）は空配列。
 * - まず先読み済みのお気に入りユーザーをローカル前方一致で解決する（同期）。
 * - 先読みが全件(complete)、またはローカルで十分な件数が取れた場合はサーバー通信しない。
 * - 不足かつ complete でないときだけ、デバウンス付きでサーバーへ問い合わせる。
 *
 * ※ 先読みは「お気に入りユーザー」なので complete でも全ユーザーを網羅しているわけではない。
 *   そのため空入力("@"だけ)以外では、ローカルで LIMIT 件に満たなければサーバーにも聞く。
 */
export function useMentionSuggestions(query: string | null): UserSuggestion[] {
  const [preload, setPreload] = useState<Preload | null>(null);
  const [serverResult, setServerResult] = useState<{ q: string; list: UserSuggestion[] } | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loadPreload()
      .then((p) => { if (!cancelled) setPreload(p); })
      .catch(() => { /* 先読み失敗時はサーバー補完のみで動作する */ });
    return () => { cancelled = true; };
  }, []);

  // ローカルで解決できる分（同期計算）。needServer が true のときだけサーバー補完が要る。
  const local = useMemo<{ list: UserSuggestion[]; needServer: boolean }>(() => {
    if (query === null) return { list: [], needServer: false };

    const items = preload?.items ?? [];

    // 空入力（"@"だけ）のときはお気に入りユーザーをそのまま出す。
    // accountID の前方一致が無い状態でサーバーに聞いても意味がないので通信しない。
    if (query === '') return { list: items.slice(0, SUGGEST_LIMIT), needServer: false };

    const lower = query.toLowerCase();
    const localMatches = items
      .filter((u) => u.accountID.toLowerCase().startsWith(lower))
      .slice(0, SUGGEST_LIMIT);

    if (localMatches.length >= SUGGEST_LIMIT) {
      return { list: localMatches, needServer: false };
    }

    // サーバー結果キャッシュの再利用（完全一致 or 網羅済みの短いプレフィックスの部分集合）。
    const exact = serverCache.get(query);
    if (exact) {
      return { list: dedupeByID([...localMatches, ...exact]).slice(0, SUGGEST_LIMIT), needServer: false };
    }
    for (const [p, cached] of serverCache) {
      if (query.startsWith(p) && cached.length < SUGGEST_LIMIT) {
        // p の結果が網羅済み(件数 < LIMIT)なら、より長い query はその部分集合。
        const filtered = cached.filter((u) => u.accountID.toLowerCase().startsWith(lower));
        return { list: dedupeByID([...localMatches, ...filtered]).slice(0, SUGGEST_LIMIT), needServer: false };
      }
    }

    return { list: localMatches, needServer: true };
  }, [query, preload]);

  // 不足時のみ、デバウンス付きでサーバーへ問い合わせる。setState は非同期コールバック内でのみ行う。
  useEffect(() => {
    if (query === null || !local.needServer) return;
    const q = query;
    const reqId = ++requestIdRef.current;
    const timer = setTimeout(() => {
      suggestUsers(q, SUGGEST_LIMIT)
        .then((server) => {
          serverCache.set(q, server);
          if (reqId !== requestIdRef.current) return; // 古いレスポンスは破棄
          setServerResult({ q, list: server });
        })
        .catch(() => { /* 失敗時はローカル候補のまま */ });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, local.needServer]);

  return useMemo(() => {
    if (query === null) return [];
    if (!local.needServer) return local.list;
    // 現在の query に対応するサーバー結果だけをマージ（古い結果は無視）。
    const server = serverResult && serverResult.q === query ? serverResult.list : [];
    return dedupeByID([...local.list, ...server]).slice(0, SUGGEST_LIMIT);
  }, [query, local, serverResult]);
}
