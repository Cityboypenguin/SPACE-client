import { useCallback, useLayoutEffect, useRef } from 'react';

// プリペンド（上方向ページング）中のスクロール位置を維持する。
// loadingOlder と messages.length の両方の変化で補正することで、
// ローディングテキスト出現→メッセージ追加の2段階を滑らかにつなぐ。
export const useScrollRestoreOnPrepend = (
  containerRef: { current: HTMLDivElement | null },
  messageCount: number,
  loadingOlder: boolean,
) => {
  const adjustedScrollHeightRef = useRef(0);

  const beginRestore = useCallback(() => {
    const el = containerRef.current;
    if (el) adjustedScrollHeightRef.current = el.scrollHeight;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || adjustedScrollHeightRef.current === 0) return;
    const diff = el.scrollHeight - adjustedScrollHeightRef.current;
    el.scrollTop += diff;
    adjustedScrollHeightRef.current = loadingOlder ? el.scrollHeight : 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingOlder, messageCount]);

  return { beginRestore };
};
