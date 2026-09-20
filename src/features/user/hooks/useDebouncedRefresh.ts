import { useCallback, useEffect, useRef } from 'react';

// room_changed は「このルームが更新された」という事実だけを運ぶので、未読数を知るには
// 受け取った側が取得し直すことになる。賑やかなルームでは1秒に何度もイベントが届くため、
// そのたびに一覧を取り直すと同じクエリの連打になる。短時間に届いたぶんはまとめて1回に
// する（末尾で1回実行する trailing debounce。先頭で撃たないのは、イベントが運ぶのは
// 事実だけで、最後の1回さえ走れば結果は同じだから）。
const DEFAULT_DELAY_MS = 400;

/**
 * refresh を「最後の呼び出しから delay ミリ秒後に1回だけ」実行する形にして返す。
 *
 * アンマウント時は待機中のぶんを捨てる（消えた画面のために取得を走らせない）。
 */
export const useDebouncedRefresh = (refresh: () => void, delay = DEFAULT_DELAY_MS) => {
  const refreshRef = useRef(refresh);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      refreshRef.current();
    }, delay);
  }, [delay]);
};
