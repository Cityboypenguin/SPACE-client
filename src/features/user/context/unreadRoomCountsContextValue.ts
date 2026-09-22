import { createContext } from 'react';

export type UnreadRoomCountsContextValue = {
  dmUnreadCount: number;
  communityUnreadCount: number;
  // 現在の学期の時間割に入っている授業チャットの未読件数（ルームIDごと）。
  // 時間割のコマとサイドバーの授業アイコンが同じ値を見るのでここに置く。
  courseUnreadCounts: Record<string, number>;
};

export const UnreadRoomCountsContext = createContext<UnreadRoomCountsContextValue>({
  dmUnreadCount: 0,
  communityUnreadCount: 0,
  courseUnreadCounts: {},
});
