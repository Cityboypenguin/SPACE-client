import { request } from '../../../lib/graphql';
import { getUserToken } from './auth';

export type NotificationActor = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export type NotificationTargetPost = {
  ID: string;
  content: string;
  deletedAt?: string | null;
  user: {
    ID: string;
    name: string;
    accountID: string;
  };
  media: { ID: string; url: string; contentType: string }[];
};

export type Notification = {
  ID: string;
  type: string;
  actor?: NotificationActor | null;
  targetType?: string | null;
  targetID?: string | null;
  targetPost?: NotificationTargetPost | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationPage = { items: Notification[]; total: number };

export type NotificationGroup = {
  key: string;
  type: string;
  actor?: NotificationActor | null;
  targetType?: string | null;
  targetID?: string | null;
  targetPost?: NotificationTargetPost | null;
  message: string;
  createdAt: string;
  count: number;
  unreadCount: number;
  latestID: string;
};

export type NotificationGroupPage = { items: NotificationGroup[]; total: number };

const MY_NOTIFICATIONS_QUERY = `
  query MyNotifications($limit: Int, $offset: Int, $type: String, $actorID: ID) {
    myNotifications(limit: $limit, offset: $offset, type: $type, actorID: $actorID) {
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
        targetPost {
          ID
          content
          deletedAt
          user {
            ID
            name
            accountID
          }
          media {
            ID
            url
            contentType
          }
        }
        message
        isRead
        createdAt
      }
      total
    }
  }
`;

const MY_NOTIFICATION_GROUPS_QUERY = `
  query MyNotificationGroups($limit: Int, $offset: Int) {
    myNotificationGroups(limit: $limit, offset: $offset) {
      items {
        key
        type
        actor {
          ID
          name
          accountID
          avatarUrl
        }
        targetType
        targetID
        targetPost {
          ID
          content
          deletedAt
          user {
            ID
            name
            accountID
          }
          media {
            ID
            url
            contentType
          }
        }
        message
        createdAt
        count
        unreadCount
        latestID
      }
      total
    }
  }
`;

const NOTIFICATION_QUERY = `
  query Notification($id: ID!) {
    notification(id: $id) {
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
      targetPost {
        ID
        content
        deletedAt
        user {
          ID
          name
          accountID
        }
        media {
          ID
          url
          contentType
        }
      }
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

const MARK_ALL_AS_READ_BY_ACTOR_MUTATION = `
  mutation MarkAllNotificationsAsReadByActor($type: String!, $actorID: ID!) {
    markAllNotificationsAsReadByActor(type: $type, actorID: $actorID)
  }
`;

export const listMyNotifications = async (
  limit = 20,
  offset = 0,
  type?: string,
  actorID?: string,
): Promise<NotificationPage> => {
  const data = await request<{ myNotifications: NotificationPage }>(
    MY_NOTIFICATIONS_QUERY,
    { limit, offset, type, actorID },
    getUserToken(),
  );
  return data.myNotifications ?? { items: [], total: 0 };
};

export const listMyNotificationGroups = async (limit = 20, offset = 0): Promise<NotificationGroupPage> => {
  const data = await request<{ myNotificationGroups: NotificationGroupPage }>(
    MY_NOTIFICATION_GROUPS_QUERY,
    { limit, offset },
    getUserToken(),
  );
  return data.myNotificationGroups ?? { items: [], total: 0 };
};

export const getNotification = async (id: string): Promise<Notification | null> => {
  const data = await request<{ notification: Notification | null }>(
    NOTIFICATION_QUERY,
    { id },
    getUserToken(),
  );
  return data.notification ?? null;
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

export const markAllNotificationsAsReadByActor = async (type: string, actorID: string): Promise<void> => {
  await request<{ markAllNotificationsAsReadByActor: boolean }>(
    MARK_ALL_AS_READ_BY_ACTOR_MUTATION,
    { type, actorID },
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

const DELETE_READ_NOTIFICATIONS_BY_ACTOR_MUTATION = `
  mutation DeleteReadNotificationsByActor($type: String!, $actorID: ID!) {
    deleteReadNotificationsByActor(type: $type, actorID: $actorID)
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

export const deleteReadNotificationsByActor = async (type: string, actorID: string): Promise<void> => {
  await request<{ deleteReadNotificationsByActor: boolean }>(
    DELETE_READ_NOTIFICATIONS_BY_ACTOR_MUTATION,
    { type, actorID },
    getUserToken(),
  );
};
