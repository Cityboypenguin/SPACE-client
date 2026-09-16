import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { storageUrl } from '../../../lib/storage';
import { getUserToken } from './auth';
import { MEDIA_FIELDS_RAW, type Media, type MediaInput } from '../../../lib/media';
import { type Mention, type MentionCandidate } from '../../../lib/mentions';

export type MessageUser = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export const DELETED_ACCOUNT_ID = 'deleted-account';

export type { Media, MediaInput };

// 引用返信の返信先として表示する最小限の情報。返信先の返信先までは辿らない（1階層）。
export type ReplyTarget = {
  ID: string;
  user: MessageUser;
  content: string;
  media: Media[];
  isMine: boolean;
};

export type Message = {
  ID: string;
  roomID: string;
  user: MessageUser;
  content: string;
  media: Media[];
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
  // replyToID があるのに replyTo が null なら、返信先は削除済み。
  replyToID?: string | null;
  replyTo?: ReplyTarget | null;
  // 本文中のメンション（コミュニティのみ）。表示側は text を本文と突き合わせて着色する。
  mentions: Mention[];
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
  media {${MEDIA_FIELDS_RAW}}
  createdAt
  updatedAt
  isMine
  replyToID
  replyTo {
    ID
    user {
      ID
      name
      accountID
      avatarUrl
    }
    content
    media {${MEDIA_FIELDS_RAW}}
    isMine
  }
  mentions {
    user {
      ID
      name
      accountID
      avatarUrl
    }
    text
  }
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
  mutation SendMessage($roomID: ID!, $content: String!, $mediaInputs: [MediaUploadInput!], $mentionUserIDs: [ID!], $replyToID: ID) {
    sendMessage(roomID: $roomID, content: $content, mediaInputs: $mediaInputs, mentionUserIDs: $mentionUserIDs, replyToID: $replyToID) {
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
        ...MediaFields
      }
      createdAt
      updatedAt
      isMine
      replyToID
      replyTo {
        ID
        user {
          ID
          name
          accountID
          avatarUrl
        }
        content
        media {
          ...MediaFields
        }
        isMine
      }
      mentions {
        user {
          ID
          name
          accountID
          avatarUrl
        }
        text
      }
    }
  }
`);

const UpdateMessageDocument = graphql(`
  mutation UpdateMessage($roomID: ID!, $id: ID!, $content: String!, $mentionUserIDs: [ID!]) {
    updateMessage(roomID: $roomID, id: $id, content: $content, mentionUserIDs: $mentionUserIDs) {
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
        ...MediaFields
      }
      createdAt
      updatedAt
      isMine
      replyToID
      replyTo {
        ID
        user {
          ID
          name
          accountID
          avatarUrl
        }
        content
        media {
          ...MediaFields
        }
        isMine
      }
      mentions {
        user {
          ID
          name
          accountID
          avatarUrl
        }
        text
      }
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
  query ListMessages($roomID: ID!, $limit: Int, $before: ID, $after: ID, $afterTime: String, $around: ID) {
    messages(roomID: $roomID, limit: $limit, before: $before, after: $after, afterTime: $afterTime, around: $around) {
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
          ...MediaFields
        }
        createdAt
        updatedAt
        isMine
        replyToID
        replyTo {
          ID
          user {
            ID
            name
            accountID
            avatarUrl
          }
          content
          media {
            ...MediaFields
          }
          isMine
        }
        mentions {
          user {
            ID
            name
            accountID
            avatarUrl
          }
          text
        }
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

const MentionCandidatesDocument = graphql(`
  query MentionCandidates($roomID: ID!) {
    mentionCandidates(roomID: $roomID) {
      ID
      name
      accountID
      avatarUrl
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

// コミュニティチャットの "@表示名" メンションでサジェストに出せる相手。
// サーバー側が送信時の検証とまったく同じ条件（メンバー・凍結・ブロック・自分自身）で
// 絞り込んで返すので、クライアントは前方一致で絞るだけでよい。
// コミュニティ以外のルームでは空配列が返る。
export const getMentionCandidates = async (roomID: string): Promise<MentionCandidate[]> => {
  const data = await requestDoc(MentionCandidatesDocument, { roomID }, getUserToken());
  return data.mentionCandidates;
};

export const markRoomAsRead = async (roomID: string) => {
  const token = getUserToken();
  return await requestDoc(MarkRoomAsReadDocument, { roomID }, token);
};

export const getOrCreateDMRoom = async (targetUserID: string) => {
  const token = getUserToken();
  return await requestDoc(GetOrCreateDMRoomDocument, { targetUserID }, token);
};

export const sendMessage = async (
  roomID: string,
  content: string,
  mediaInputs?: MediaInput[],
  replyToID?: string | null,
  // メンション先のユーザーID（コミュニティのみ）。サジェストから選んだ相手だけを渡す。
  mentionUserIDs?: string[],
) => {
  const token = getUserToken();
  return await requestDoc(SendMessageDocument, { roomID, content, mediaInputs, mentionUserIDs, replyToID }, token);
};

export type ListMessagesOptions = {
  before?: string;
  after?: string;
  afterTime?: string;
  // 指定メッセージを中心に前後 limit 件ずつ取得する（引用タップ・返信通知のジャンプ用）
  around?: string;
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
      ...(options?.around ? { around: options.around } : {}),
    },
    getUserToken(),
  );
  return data.messages;
};

export const getRoom = async (id: string) => {
  return await requestDoc(GetRoomDocument, { id }, getUserToken());
};

export const updateMessage = async (
  roomID: string,
  id: string,
  content: string,
  mentionUserIDs?: string[],
) => {
  const token = getUserToken();
  return await requestDoc(UpdateMessageDocument, { roomID, id, content, mentionUserIDs }, token);
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
