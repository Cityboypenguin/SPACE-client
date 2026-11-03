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
  const [dismissed, setDismissed] = useState(false);

  const open = !!userId && !dismissed && !isHidden(userId);

  const close = useCallback(
    (hideForWeek: boolean) => {
      if (userId && hideForWeek) {
        try {
          localStorage.setItem(storageKey(userId), String(Date.now()));
        } catch {
          // 保存できなくても、このセッションでは閉じる。
        }
      }
      setDismissed(true);
    },
    [userId],
  );

  return { open, close };
};
