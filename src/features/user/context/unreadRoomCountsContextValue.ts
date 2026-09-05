import { createContext } from 'react';

export type UnreadRoomCountsContextValue = {
  dmUnreadCount: number;
  communityUnreadCount: number;
};

export const UnreadRoomCountsContext = createContext<UnreadRoomCountsContextValue>({
  dmUnreadCount: 0,
  communityUnreadCount: 0,
});
