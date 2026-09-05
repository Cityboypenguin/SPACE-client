import { useContext } from 'react';
import { UnreadRoomCountsContext } from './unreadRoomCountsContextValue';

export const useUnreadRoomCounts = () => useContext(UnreadRoomCountsContext);
