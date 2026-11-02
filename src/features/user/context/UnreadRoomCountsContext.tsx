import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getMyUnreadRoomCounts, getMyUnreadRoomCountsSeparately } from '../api/message';
import { useDebouncedRefresh } from '../hooks/useDebouncedRefresh';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';
import { UnreadRoomCountsContext } from './unreadRoomCountsContextValue';

export const UnreadRoomCountsProvider = ({ children }: { children: ReactNode }) => {
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [communityUnreadCount, setCommunityUnreadCount] = useState(0);
  const [courseUnreadCounts, setCourseUnreadCounts] = useState<Record<string, number>>({});

  const applyCourseCounts = useCallback((counts: { roomID: string; unreadCount: number }[]) => {
    setCourseUnreadCounts(Object.fromEntries(counts.map((c) => [c.roomID, c.unreadCount])));
  }, []);

  const refresh = useCallback(() => {
    getMyUnreadRoomCounts()
      .then((counts) => {
        setDmUnreadCount(counts.myUnreadDMCount);
        setCommunityUnreadCount(counts.myUnreadCommunityCount);
        applyCourseCounts(counts.myCourseRoomUnreadCounts);
      })
      .catch(() => {
        const { dm, community, course } = getMyUnreadRoomCountsSeparately();
        dm.then(setDmUnreadCount).catch(() => {});
        community.then(setCommunityUnreadCount).catch(() => {});
        course.then(applyCourseCounts).catch(() => {});
      });
  }, [applyCourseCounts]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  // room_changed はペイロード（roomID / messageID / lastMessage）を使わない。
  // ここが欲しいのは種別ごとの合計と授業ルームごとの件数で、どちらもサーバに数えて
  // もらうしかないため
  // 「更新があった」ことだけを合図に取り直す。新着でも既読でも合計は動くので、
  // hasNewMessage は見ない。連続イベントでクエリを連打しないようまとめる。
  useUnreadSubscription(useDebouncedRefresh(refresh));

  return (
    <UnreadRoomCountsContext.Provider value={{ dmUnreadCount, communityUnreadCount, courseUnreadCounts }}>
      {children}
    </UnreadRoomCountsContext.Provider>
  );
};
