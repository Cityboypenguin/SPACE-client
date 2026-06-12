import { request } from '../../../lib/graphql';
import { getUserToken } from './auth';

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

export type NotificationPage = { items: Notification[]; total: number };

const MY_NOTIFICATIONS_QUERY = `
  query MyNotifications($limit: Int, $offset: Int) {
    myNotifications(limit: $limit, offset: $offset) {
      items {
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
      total
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

export const listMyNotifications = async (limit = 20, offset = 0): Promise<NotificationPage> => {
  const data = await request<{ myNotifications: NotificationPage }>(
    MY_NOTIFICATIONS_QUERY,
    { limit, offset },
    getUserToken(),
  );
  return data.myNotifications ?? { items: [], total: 0 };
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

const DELETE_NOTIFICATIONS_MUTATION = `
  mutation DeleteNotifications($ids: [ID!]!) {
    deleteNotifications(ids: $ids)
  }
`;

const DELETE_READ_NOTIFICATIONS_MUTATION = `
  mutation DeleteReadNotifications {
    deleteReadNotifications
  }
`;

export const deleteNotifications = async (ids: string[]): Promise<void> => {
  await request<{ deleteNotifications: boolean }>(
    DELETE_NOTIFICATIONS_MUTATION,
    { ids },
    getUserToken(),
  );
};

export const deleteReadNotifications = async (): Promise<void> => {
  await request<{ deleteReadNotifications: boolean }>(
    DELETE_READ_NOTIFICATIONS_MUTATION,
    undefined,
    getUserToken(),
  );
};
