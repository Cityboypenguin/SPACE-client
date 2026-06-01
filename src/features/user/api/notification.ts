import { request } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from './auth';

export type NotificationActor = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export type Notification = {
  ID: string;
  type: string;
  actor?: NotificationActor | null;
  targetType?: string | null;
  targetID?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

const MY_NOTIFICATIONS_QUERY = `
  query MyNotifications($limit: Int) {
    myNotifications(limit: $limit) {
      ID
      type
      actor {
        ID
        name
        accountID
        avatarUrl
      }
      targetType
      targetID
      message
      isRead
      createdAt
    }
  }
`;

const MY_UNREAD_COUNT_QUERY = `
  query MyUnreadNotificationCount {
    myUnreadNotificationCount
  }
`;

const MARK_AS_READ_MUTATION = `
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id)
  }
`;

const MARK_ALL_AS_READ_MUTATION = `
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`;

export const listMyNotifications = async (limit?: number): Promise<Notification[]> => {
  const data = await request<{ myNotifications: Notification[] }>(
    MY_NOTIFICATIONS_QUERY,
    limit !== undefined ? { limit } : undefined,
    getUserToken(),
  );
  return data.myNotifications ?? [];
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const data = await request<{ myUnreadNotificationCount: number }>(
    MY_UNREAD_COUNT_QUERY,
    undefined,
    getUserToken(),
  );
  return data.myUnreadNotificationCount;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await request<{ markNotificationAsRead: boolean }>(
    MARK_AS_READ_MUTATION,
    { id },
    getUserToken(),
  );
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await request<{ markAllNotificationsAsRead: boolean }>(
    MARK_ALL_AS_READ_MUTATION,
    undefined,
    getUserToken(),
  );
};
