import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getUnreadDMCount } from '../api/message';
import { getUnreadCommunityCount } from '../api/community';
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

  useUnreadSubscription(refresh);

  return (
    <UnreadRoomCountsContext.Provider value={{ dmUnreadCount, communityUnreadCount }}>
      {children}
    </UnreadRoomCountsContext.Provider>
  );
};
