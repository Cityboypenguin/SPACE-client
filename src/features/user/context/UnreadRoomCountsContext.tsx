import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getUnreadDMCount } from '../api/message';
import { getUnreadCommunityCount } from '../api/community';
import { useDebouncedRefresh } from '../hooks/useDebouncedRefresh';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';
import { UnreadRoomCountsContext } from './unreadRoomCountsContextValue';

export const UnreadRoomCountsProvider = ({ children }: { children: ReactNode }) => {
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [communityUnreadCount, setCommunityUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    getUnreadDMCount().then(setDmUnreadCount).catch(() => {});
    getUnreadCommunityCount().then(setCommunityUnreadCount).catch(() => {});
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  // room_changed はペイロード（roomID / messageID / lastMessage）を使わない。
  // ここが欲しいのは種別ごとの合計だけで、それはサーバに数えてもらうしかないため
  // 「更新があった」ことだけを合図に取り直す。新着でも既読でも合計は動くので、
  // hasNewMessage は見ない。連続イベントでクエリを連打しないようまとめる。
  useUnreadSubscription(useDebouncedRefresh(refresh));

  return (
    <UnreadRoomCountsContext.Provider value={{ dmUnreadCount, communityUnreadCount }}>
      {children}
    </UnreadRoomCountsContext.Provider>
  );
};
