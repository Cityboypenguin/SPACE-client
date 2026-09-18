import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';
import { type Media } from './message';

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
  media: Media[];
};

// 返信通知の遷移先。ルーム種別でチャット画面のパスが変わるため room も引く。
export type NotificationTargetMessage = {
  ID: string;
  roomID: string;
  room: { ID: string; type: string };
};

export type Notification = {
  ID: string;
  type: string;
  actor?: NotificationActor | null;
  targetType?: string | null;
  targetID?: string | null;
  targetPost?: NotificationTargetPost | null;
  targetMessage?: NotificationTargetMessage | null;
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
  targetMessage?: NotificationTargetMessage | null;
  message: string;
  createdAt: string;
  count: number;
  unreadCount: number;
  latestID: string;
};

export type NotificationGroupPage = { items: NotificationGroup[]; total: number };

const MyNotificationsDocument = graphql(`
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
            ...MediaFields
          }
        }
        targetMessage {
          ID
          roomID
          room {
            ID
            type
          }
        }
        message
        isRead
        createdAt
      }
      total
    }
  }
`);

const MyNotificationGroupsDocument = graphql(`
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
            ...MediaFields
          }
        }
        targetMessage {
          ID
          roomID
          room {
            ID
            type
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
`);

const NotificationDocument = graphql(`
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
          ...MediaFields
        }
      }
      targetMessage {
        ID
        roomID
        room {
          ID
          type
        }
      }
      message
      isRead
      createdAt
    }
  }
`);

const MyUnreadNotificationCountDocument = graphql(`
  query MyUnreadNotificationCount {
    myUnreadNotificationCount
  }
`);

// SSE(/events) へ繋ぐための使い捨てチケット。
//
// ブラウザ標準の EventSource はカスタムヘッダーを送れないため、認証情報は URL に
// 載せるしかない。以前はアクセストークンをそのまま ?token= に載せていたが、URL は
// アクセスログ・プロキシ・監視基盤に残るので、拾われると有効期限まで使い回せてしまう。
// 代わりに「1回使ったら無効・30秒で失効」するチケットを載せる。
const IssueNotificationStreamTicketDocument = graphql(`
  mutation IssueNotificationStreamTicket {
    issueNotificationStreamTicket
  }
`);

const MarkNotificationAsReadDocument = graphql(`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id)
  }
`);

const MarkAllNotificationsAsReadDocument = graphql(`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`);

const MarkAllNotificationsAsReadByActorDocument = graphql(`
  mutation MarkAllNotificationsAsReadByActor($type: String!, $actorID: ID!) {
    markAllNotificationsAsReadByActor(type: $type, actorID: $actorID)
  }
`);

export const listMyNotifications = async (
  limit = 20,
  offset = 0,
  type?: string,
  actorID?: string,
): Promise<NotificationPage> => {
  const data = await requestDoc(MyNotificationsDocument, { limit, offset, type, actorID }, getUserToken());
  return data.myNotifications ?? { items: [], total: 0 };
};

export const listMyNotificationGroups = async (limit = 20, offset = 0): Promise<NotificationGroupPage> => {
  const data = await requestDoc(MyNotificationGroupsDocument, { limit, offset }, getUserToken());
  return data.myNotificationGroups ?? { items: [], total: 0 };
};

export const getNotification = async (id: string): Promise<Notification | null> => {
  const data = await requestDoc(NotificationDocument, { id }, getUserToken());
  return data.notification ?? null;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const data = await requestDoc(MyUnreadNotificationCountDocument, {}, getUserToken());
  return data.myUnreadNotificationCount;
};

// チケットは使い捨てなので、接続のたび（再接続も含め）に取り直すこと。
// 使い回すと 401 になる。
export const issueNotificationStreamTicket = async (): Promise<string> => {
  const data = await requestDoc(IssueNotificationStreamTicketDocument, {}, getUserToken());
  return data.issueNotificationStreamTicket;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await requestDoc(MarkNotificationAsReadDocument, { id }, getUserToken());
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await requestDoc(MarkAllNotificationsAsReadDocument, {}, getUserToken());
};

export const markAllNotificationsAsReadByActor = async (type: string, actorID: string): Promise<void> => {
  await requestDoc(MarkAllNotificationsAsReadByActorDocument, { type, actorID }, getUserToken());
};

const DeleteNotificationsDocument = graphql(`
  mutation DeleteNotifications($ids: [ID!]!) {
    deleteNotifications(ids: $ids)
  }
`);

const DeleteReadNotificationsDocument = graphql(`
  mutation DeleteReadNotifications {
    deleteReadNotifications
  }
`);

const DeleteReadNotificationsByActorDocument = graphql(`
  mutation DeleteReadNotificationsByActor($type: String!, $actorID: ID!) {
    deleteReadNotificationsByActor(type: $type, actorID: $actorID)
  }
`);

export const deleteNotifications = async (ids: string[]): Promise<void> => {
  await requestDoc(DeleteNotificationsDocument, { ids }, getUserToken());
};

export const deleteReadNotifications = async (): Promise<void> => {
  await requestDoc(DeleteReadNotificationsDocument, {}, getUserToken());
};

export const deleteReadNotificationsByActor = async (type: string, actorID: string): Promise<void> => {
  await requestDoc(DeleteReadNotificationsByActorDocument, { type, actorID }, getUserToken());
};
