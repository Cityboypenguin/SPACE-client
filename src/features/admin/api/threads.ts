import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type AdminThread = {
  roomID: string;
  title: string;
  isClosed: boolean;
  createdAt: string;
  messageCount: number;
  lastMessageAt?: string | null;
};

// サーバーは1回に50件までしか返さない。
export const adminThreadPageSize = 50;

const ListChatThreadsDocument = graphql(`
  query AdminListChatThreads($parentRoomID: ID!, $limit: Int!, $offset: Int!) {
    chatThreads(parentRoomID: $parentRoomID, limit: $limit, offset: $offset) {
      roomID
      title
      isClosed
      createdAt
      messageCount
      lastMessageAt
    }
  }
`);

export const listChatThreads = async (parentRoomID: string, offset = 0): Promise<AdminThread[]> => {
  const data = await requestDoc(
    ListChatThreadsDocument,
    { parentRoomID, limit: adminThreadPageSize, offset },
    getAdminToken(),
  );
  return data.chatThreads;
};

const GetChatThreadDocument = graphql(`
  query AdminGetChatThread($roomID: ID!) {
    chatThread(roomID: $roomID) {
      roomID
      title
      isClosed
      createdAt
      messageCount
      lastMessageAt
    }
  }
`);

export const getChatThread = async (roomID: string): Promise<AdminThread | null> => {
  const data = await requestDoc(GetChatThreadDocument, { roomID }, getAdminToken());
  return data.chatThread ?? null;
};

const DeleteChatThreadDocument = graphql(`
  mutation AdminDeleteChatThread($roomID: ID!) {
    deleteChatThread(roomID: $roomID)
  }
`);

// スレッドと中のメッセージをすべて消す。親チャットの「スレッドを作成しました」の案内も消える。
export const deleteChatThread = async (roomID: string) => {
  await requestDoc(DeleteChatThreadDocument, { roomID }, getAdminToken());
};
