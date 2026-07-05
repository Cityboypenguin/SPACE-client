import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
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
  const { token } = useAuth();
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [communityUnreadCount, setCommunityUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    getUnreadDMCount().then(setDmUnreadCount).catch(() => {});
    getUnreadCommunityCount().then(setCommunityUnreadCount).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) {
      setDmUnreadCount(0);
      setCommunityUnreadCount(0);
      return;
    }
    refresh();
  }, [token, refresh]);

  useUnreadSubscription(() => {
    if (token) refresh();
  });

  return (
    <UnreadRoomCountsContext.Provider value={{ dmUnreadCount, communityUnreadCount }}>
      {children}
    </UnreadRoomCountsContext.Provider>
  );
};
