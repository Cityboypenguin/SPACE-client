import { useEffect, useState } from 'react';
import { getVideoSettings } from '../api/video';

// useRetentionDays は保存期間（日）。投稿前に「何日で消えるか」を出すために使う。
export const useRetentionDays = (): number | null => {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    getVideoSettings()
      .then((s) => { if (alive) setDays(s.retentionDays); })
      .catch(() => { /* 出せないときは文言を省く */ });
    return () => { alive = false; };
  }, []);
  return days;
};
