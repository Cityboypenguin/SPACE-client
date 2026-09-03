import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { storageUrl } from '../../../lib/storage';
import { getUserToken } from './auth';

export type MessageUser = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export const DELETED_ACCOUNT_ID = 'deleted-account';

export type Media = {
  ID: string;
  url: string;
  contentType: string;
};

export type MediaInput = {
  objectKey: string;
  contentType: string;
};

export type Message = {
  ID: string;
  roomID: string;
  user: MessageUser;
  content: string;
  media: Media[];
  createdAt: string;
  updatedAt: string;
};

export type Room = {
  ID: string;
  name: string;
  type: string;
  user: MessageUser[];
  isMessagingDisabled: boolean;
  lastReadAt?: string | null;
  unreadCount: number;
  partnerLastReadAt?: string | null;
  lastMessage?: string | null;
};

// useRoomMessages.ts の WebSocket サブスクリプション（別系統の subscribeToGraphQL 経由、
// codegen の対象外）が引き続き参照するため、このフィールド選択の文字列定数は残す。
export const MESSAGE_FIELDS = `
  ID
  roomID
  user {
    ID
    name
    accountID
    avatarUrl
  }
  content
  media {
    ID
    url
    contentType
  }
  createdAt
  updatedAt
`;

const MarkRoomAsReadDocument = graphql(`
  mutation MarkRoomAsRead($roomID: ID!) {
    markRoomAsRead(roomID: $roomID)
  }
`);

const GetOrCreateDMRoomDocument = graphql(`
  mutation GetOrCreateDMRoom($targetUserID: ID!) {
    getOrCreateDMRoom(targetUserID: $targetUserID) {
      ID
      name
      type
      user {
        ID
        name
        accountID
        avatarUrl
      }
      isMessagingDisabled
      lastReadAt
      unreadCount
      partnerLastReadAt
      content
    }
  }
`);

const SendMessageDocument = graphql(`
  mutation SendMessage($roomID: ID!, $content: String!, $mediaInputs: [MediaUploadInput!]) {
    sendMessage(roomID: $roomID, content: $content, mediaInputs: $mediaInputs) {
      ID
      roomID
      user {
        ID
        name
        accountID
        avatarUrl
      }
      content
      media {
        ID
        url
        contentType
      }
      createdAt
      updatedAt
    }
  }
`);

const UpdateMessageDocument = graphql(`
  mutation UpdateMessage($roomID: ID!, $id: ID!, $content: String!) {
    updateMessage(roomID: $roomID, id: $id, content: $content) {
      ID
      roomID
      user {
        ID
        name
        accountID
        avatarUrl
      }
      content
      media {
        ID
        url
        contentType
      }
      createdAt
      updatedAt
    }
  }
`);

const DeleteMessageDocument = graphql(`
  mutation DeleteMessage($roomID: ID!, $id: ID!) {
    deleteMessage(roomID: $roomID, id: $id)
  }
`);

const DeleteRoomDocument = graphql(`
  mutation DeleteRoom($roomID: ID!) {
    deleteRoom(roomID: $roomID)
  }
`);

const ListMessagesDocument = graphql(`
  query ListMessages($roomID: ID!, $limit: Int, $before: ID, $after: ID, $afterTime: String) {
    messages(roomID: $roomID, limit: $limit, before: $before, after: $after, afterTime: $afterTime) {
      items {
        ID
        roomID
        user {
          ID
          name
          accountID
          avatarUrl
        }
        content
        media {
          ID
          url
          contentType
        }
        createdAt
        updatedAt
      }
      hasMoreBefore
      hasMoreAfter
    }
  }
`);

export type MessagePage = {
  items: Message[];
  hasMoreBefore: boolean;
  hasMoreAfter: boolean;
};

const GetRoomDocument = graphql(`
  query GetRoom($id: ID!) {
    room(id: $id) {
      ID
      name
      type
      user {
        ID
        name
        accountID
        avatarUrl
      }
      isMessagingDisabled
      lastReadAt
      unreadCount
      partnerLastReadAt
      content
    }
  }
`);

const MyDMRoomsDocument = graphql(`
  query MyDMRooms($limit: Int, $offset: Int) {
    myDMRooms(limit: $limit, offset: $offset) {
      items {
        ID
        name
        type
        user {
          ID
          name
          accountID
          avatarUrl
        }
        isMessagingDisabled
        lastReadAt
        unreadCount
        partnerLastReadAt
        content
      }
      total
    }
  }
`);

const PresignedMediaUploadUrlDocument = graphql(`
  query PresignedMediaUploadUrl($contentType: String!) {
    presignedMediaUploadUrl(contentType: $contentType) {
      uploadUrl
      objectKey
    }
  }
`);

export const markRoomAsRead = async (roomID: string) => {
  const token = getUserToken();
  return await requestDoc(MarkRoomAsReadDocument, { roomID }, token);
};

export const getOrCreateDMRoom = async (targetUserID: string) => {
  const token = getUserToken();
  return await requestDoc(GetOrCreateDMRoomDocument, { targetUserID }, token);
};

export const sendMessage = async (roomID: string, content: string, mediaInputs?: MediaInput[]) => {
  const token = getUserToken();
  return await requestDoc(SendMessageDocument, { roomID, content, mediaInputs }, token);
};

export type ListMessagesOptions = {
  before?: string;
  after?: string;
  afterTime?: string;
};

export const listMessages = async (roomID: string, limit = 50, options?: ListMessagesOptions): Promise<MessagePage> => {
  const data = await requestDoc(
    ListMessagesDocument,
    {
      roomID,
      limit,
      ...(options?.before ? { before: options.before } : {}),
      ...(options?.after ? { after: options.after } : {}),
      ...(options?.afterTime ? { afterTime: options.afterTime } : {}),
    },
    getUserToken(),
  );
  return data.messages;
};

export const getRoom = async (id: string) => {
  return await requestDoc(GetRoomDocument, { id }, getUserToken());
};

export const updateMessage = async (roomID: string, id: string, content: string) => {
  const token = getUserToken();
  return await requestDoc(UpdateMessageDocument, { roomID, id, content }, token);
};

export const deleteMessage = async (roomID: string, id: string) => {
  const token = getUserToken();
  return await requestDoc(DeleteMessageDocument, { roomID, id }, token);
};

export const deleteRoom = async (roomID: string) => {
  const token = getUserToken();
  return await requestDoc(DeleteRoomDocument, { roomID }, token);
};

export const listMyDMRooms = async (limit = 20, offset = 0): Promise<{ items: Room[]; total: number }> => {
  const token = getUserToken();
  const data = await requestDoc(MyDMRoomsDocument, { limit, offset }, token);
  const items = data.myDMRooms.items.map(({ content, ...rest }) => ({ ...rest, lastMessage: content ?? null }));
  return { items, total: data.myDMRooms.total };
};

const MyUnreadDMCountDocument = graphql(`
  query MyUnreadDMCount {
    myUnreadDMCount
  }
`);

export const getUnreadDMCount = async (): Promise<number> => {
  const data = await requestDoc(MyUnreadDMCountDocument, {}, getUserToken());
  return data.myUnreadDMCount;
};

export const getPresignedMediaUploadUrl = async (contentType: string) => {
  const token = getUserToken();
  if (!token) throw new Error('認証が必要です。');
  return await requestDoc(PresignedMediaUploadUrlDocument, { contentType }, token);
};

export const uploadFileToStorage = async (uploadUrl: string, file: File): Promise<void> => {
  const res = await fetch(storageUrl(uploadUrl) ?? uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('ファイルのアップロードに失敗しました。');
};
