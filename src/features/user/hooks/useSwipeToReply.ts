import { useRef, useState } from 'react';

// バブルを動かせる最大距離
const MAX_DRAG_PX = 72;
// ここまで引いて指を離すと返信になる
const TRIGGER_DISTANCE_PX = 56;
// 縦スクロールと取り違えないための遊び。これを超えるまで方向を決めない
const DIRECTION_LOCK_PX = 10;
// 触れてからこの時間を過ぎて動き出した場合はスワイプとみなさない。
// 長押しでテキスト選択を始めてから、つまみを左右にドラッグする操作を
// スワイプ返信と取り違えないためのもの。
const SWIPE_START_WINDOW_MS = 400;

type Params = {
  enabled: boolean;
  /** バブルが動く向き。内側（画面中央）へ動かすので、自分の発言は -1、相手は +1 */
  direction: 1 | -1;
  onReply: () => void;
  /** 指が遊びを超えて動いたときに呼ばれる。長押し判定の取り消しに使う */
  onMoveBeyondSlop?: () => void;
};

/**
 * スマホでバブルを内側へスライドして返信する操作。
 *
 * 最初の DIRECTION_LOCK_PX で縦横どちらの操作かを決め、縦ならその操作中は
 * 何もしない（縦スクロールを邪魔しないため）。横と判定したときだけバブルを動かす。
 * 要素側に touch-action: pan-y を指定して、縦スクロールはブラウザに任せる。
 */
export const useSwipeToReply = ({ enabled, direction, onReply, onMoveBeyondSlop }: Params) => {
  const [offset, setOffset] = useState(0);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const startedAt = useRef(0);
  const axis = useRef<'undecided' | 'horizontal' | 'vertical'>('undecided');
  // touchend 時点の値を確実に読むため、描画用の state とは別に保持する
  const offsetRef = useRef(0);

  const applyOffset = (value: number) => {
    offsetRef.current = value;
    setOffset(value);
  };

  // enabled が false でも指の動きは追う。呼び出し側は onMoveBeyondSlop で
  // 長押し判定を取り消しており、ここで早期 return すると「返信できない部屋では
  // スクロールしても長押しメニューが開いてしまう」ため。
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startPoint.current = { x: touch.clientX, y: touch.clientY };
    startedAt.current = Date.now();
    axis.current = 'undecided';
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const start = startPoint.current;
    const touch = e.touches[0];
    if (!start || !touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (axis.current === 'undecided') {
      if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return;
      onMoveBeyondSlop?.();
      const startedLate = Date.now() - startedAt.current > SWIPE_START_WINDOW_MS;
      axis.current = !startedLate && Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }
    if (axis.current !== 'horizontal' || !enabled) return;

    // 内側方向の分だけ動かす。逆向きに引いても戻らない（0 のまま）
    const inward = dx * direction;
    applyOffset(inward > 0 ? Math.min(inward, MAX_DRAG_PX) * direction : 0);
  };

  const finish = () => {
    const reached = Math.abs(offsetRef.current) >= TRIGGER_DISTANCE_PX;
    startPoint.current = null;
    axis.current = 'undecided';
    applyOffset(0);
    if (reached) onReply();
  };

  return {
    offset,
    // 返信が成立する距離まで引けたか。インジケーターの見せ方に使う
    isReady: Math.abs(offset) >= TRIGGER_DISTANCE_PX,
    // 0〜1。インジケーターのフェードイン用
    progress: Math.min(Math.abs(offset) / TRIGGER_DISTANCE_PX, 1),
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd: finish,
      onTouchCancel: finish,
    },
  };
};
