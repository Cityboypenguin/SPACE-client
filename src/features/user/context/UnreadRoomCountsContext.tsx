import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getUnreadDMCount } from '../api/message';
import { getUnreadCommunityCount } from '../api/community';
import { useUnreadSubscription } from '../hooks/useUnreadSubscription';

type UnreadRoomCountsContextValue = {
  dmUnreadCount: number;
  communityUnreadCount: number;
};

const UnreadRoomCountsContext = createContext<UnreadRoomCountsContextValue>({
  dmUnreadCount: 0,
  communityUnreadCount: 0,
});

export const useUnreadRoomCounts = () => useContext(UnreadRoomCountsContext);

export const UnreadRoomCountsProvider = ({ children }: { children: ReactNode }) => {
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [communityUnreadCount, setCommunityUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    getUnreadDMCount().then(setDmUnreadCount).catch(() => {});
    getUnreadCommunityCount().then(setCommunityUnreadCount).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useUnreadSubscription(refresh);

  return (
    <UnreadRoomCountsContext.Provider value={{ dmUnreadCount, communityUnreadCount }}>
      {children}
    </UnreadRoomCountsContext.Provider>
  );
};
