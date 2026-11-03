import { useCallback, useState } from 'react';

// 「1週間表示しない」を選んだ時刻を、この端末のブラウザにだけ覚えておく。
// サーバーに持たない理由: 保存先のテーブルや API を増やす必要がなく、
// 10/14 の議論（鬱陶しさを「お願いの言い回し + 1週間非表示」で軽くする）を満たせるため。
// 別の端末・ブラウザでは、もう一度表示される。
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const storageKey = (userId: string) => `weeklyNoticeHiddenAt:${userId}`;

const isHidden = (userId: string): boolean => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return false;
    const hiddenAt = Number(raw);
    if (!Number.isFinite(hiddenAt)) return false;
    return Date.now() - hiddenAt < WEEK_MS;
  } catch {
    return false;
  }
};

export const useWeeklyNotice = (userId: string | null) => {
  // 閉じたのがどの利用者かを覚える（ログアウトして別の利用者が入ったら、その人にはまた出す）。
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  const open = !!userId && dismissedFor !== userId && !isHidden(userId);

  const close = useCallback(
    (hideForWeek: boolean) => {
      if (userId && hideForWeek) {
        try {
          localStorage.setItem(storageKey(userId), String(Date.now()));
        } catch {
          // 保存できなくても、このセッションでは閉じる。
        }
      }
      setDismissedFor(userId);
    },
    [userId],
  );

  return { open, close };
};
