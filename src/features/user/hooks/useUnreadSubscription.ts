import { useEffect, useRef } from 'react';
import { subscribeToGraphQL } from '../../../lib/graphqlWs';

const MY_UNREAD_UPDATED_SUBSCRIPTION = `
  subscription MyUnreadUpdated {
    myUnreadUpdated {
      roomID
      unreadCount
    }
  }
`;

type UnreadUpdate = { roomID: string; unreadCount: number };

export const useUnreadSubscription = (
  onUpdate: (update: UnreadUpdate) => void,
) => {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const unsubscribe = subscribeToGraphQL<{ myUnreadUpdated: UnreadUpdate }>(
      MY_UNREAD_UPDATED_SUBSCRIPTION,
      {},
      (data) => onUpdateRef.current(data.myUnreadUpdated),
      (err) => console.error('[useUnreadSubscription] error:', err),
    );
    return () => unsubscribe();
  }, []);
};
