import { useEffect, useMemo, useRef, useState } from 'react';
import { getPopularHashtags, suggestHashtags, type HashtagSuggestion } from '../api/post';

const SUGGEST_LIMIT = 8;
const DEBOUNCE_MS = 250;

// 先読み（人気タグ）はセッション内で1回だけ取得し、全フック（作成コンポーザー/ホーム検索）で共有する。
type Preload = { items: HashtagSuggestion[]; complete: boolean };
let preloadPromise: Promise<Preload> | null = null;

// サーバー結果のキャッシュ（プレフィックス -> 結果）。モジュールレベルで全フック共有。
const serverCache = new Map<string, HashtagSuggestion[]>();

function loadPreload(): Promise<Preload> {
  if (!preloadPromise) {
    preloadPromise = getPopularHashtags()
      .then((r) => ({ items: r.items, complete: r.total <= r.items.length }))
      .catch((err) => {
        // 失敗時は次回再取得できるようにキャッシュを破棄する。
        preloadPromise = null;
        throw err;
      });
  }
  return preloadPromise;
}

function dedupeByTag(list: HashtagSuggestion[]): HashtagSuggestion[] {
  const seen = new Set<string>();
  const out: HashtagSuggestion[] = [];
  for (const s of list) {
    if (seen.has(s.tag)) continue;
    seen.add(s.tag);
    out.push(s);
  }
  return out;
}

/**
 * 入力中のハッシュタグ本体(query)に対するサジェスト候補を返す。
 * - query が null のとき（ハッシュタグ入力中でない）は空配列。
 * - まず先読み済みの人気タグをローカル前方一致で解決する（同期）。
 * - 先読みが全件(complete)、またはローカルで十分な件数が取れた場合はサーバー通信しない。
 * - 不足かつ complete でないときだけ、デバウンス付きでサーバーへ問い合わせる。
 */
export function useHashtagSuggestions(query: string | null): HashtagSuggestion[] {
  const [preload, setPreload] = useState<Preload | null>(null);
  const [serverResult, setServerResult] = useState<{ q: string; list: HashtagSuggestion[] } | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loadPreload()
      .then((p) => { if (!cancelled) setPreload(p); })
      .catch(() => { /* 先読み失敗時はサーバー補完のみで動作する */ });
    return () => { cancelled = true; };
  }, []);

  // ローカルで解決できる分（同期計算）。needServer が true のときだけサーバー補完が要る。
  const local = useMemo<{ list: HashtagSuggestion[]; needServer: boolean }>(() => {
    if (query === null) return { list: [], needServer: false };

    const items = preload?.items ?? [];
    const complete = preload?.complete ?? false;

    // 空入力（"#"だけ）のときは人気上位をそのまま出す。
    if (query === '') return { list: items.slice(0, SUGGEST_LIMIT), needServer: false };

    const lower = query.toLowerCase();
    const localMatches = items.filter((s) => s.tag.toLowerCase().startsWith(lower)).slice(0, SUGGEST_LIMIT);

    if (complete || localMatches.length >= SUGGEST_LIMIT) {
      return { list: localMatches, needServer: false };
    }

    // サーバー結果キャッシュの再利用（完全一致 or 網羅済みの短いプレフィックスの部分集合）。
    const exact = serverCache.get(query);
    if (exact) {
      return { list: dedupeByTag([...localMatches, ...exact]).slice(0, SUGGEST_LIMIT), needServer: false };
    }
    for (const [p, cached] of serverCache) {
      if (query.startsWith(p) && cached.length < SUGGEST_LIMIT) {
        // p の結果が網羅済み(件数 < LIMIT)なら、より長い query はその部分集合。
        const filtered = cached.filter((s) => s.tag.toLowerCase().startsWith(lower));
        return { list: dedupeByTag([...localMatches, ...filtered]).slice(0, SUGGEST_LIMIT), needServer: false };
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
      suggestHashtags(q, SUGGEST_LIMIT)
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
    return dedupeByTag([...local.list, ...server]).slice(0, SUGGEST_LIMIT);
  }, [query, local, serverResult]);
}
