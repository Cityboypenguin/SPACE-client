import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { type Media } from '../../../lib/media';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export type MessageUser = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
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

export type Community = {
  ID: string;
  roomID: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityPage = { items: Community[]; total: number };

// Room.user / CommunityMember.user は GraphQL 上は公開型の User なので
// email を持たない。管理画面で連絡先が要るときは、そのユーザーの
// getUserByID（UserAccount）を引くこと。
export type RoomUser = {
  ID: string;
  accountID: string;
  name: string;
};

export type CommunityMember = {
  user: RoomUser;
  role: string;
};

export type Room = {
  ID: string;
  name: string;
  user: RoomUser[];
};

const CommunitiesDocument = graphql(`
  query Communities($limit: Int, $offset: Int) {
    communities(limit: $limit, offset: $offset) {
      items {
        ID
        roomID
        name
        description
        createdAt
        updatedAt
      }
      total
    }
  }
`);

const UpdateCommunityDocument = graphql(`
  mutation AdminUpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {
    updateCommunity(id: $id, input: $input) {
      ID
      roomID
      name
      description
      createdAt
      updatedAt
    }
  }
`);

const UpdateCommunityMembersDocument = graphql(`
  mutation AdminUpdateCommunityMembers($communityID: ID!, $updates: [CommunityMemberUpdateInput!]!) {
    updateCommunityMembers(communityID: $communityID, updates: $updates)
  }
`);

const GetCommunityMembersDocument = graphql(`
  query AdminCommunityMembers($communityID: ID!, $limit: Int!, $offset: Int!) {
    communityMembers(communityID: $communityID, limit: $limit, offset: $offset) {
      items {
        user {
          ID
          accountID
          name
        }
        role
      }
      total
    }
  }
`);

export const getCommunities = async (limit = 20, offset = 0) => {
  return await requestDoc(CommunitiesDocument, { limit, offset }, getAdminToken());
};

export const updateCommunity = async (
  id: string,
  input: { name?: string; description?: string },
) => {
  return await requestDoc(UpdateCommunityDocument, { id, input }, getAdminToken());
};

export const kickUserFromCommunity = async (communityID: string, userID: string) => {
  return await requestDoc(UpdateCommunityMembersDocument, { communityID, updates: [{ userID, action: 'KICK' }] }, getAdminToken());
};

export const getCommunityMembers = async (communityID: string, limit = 50, offset = 0) => {
  return await requestDoc(GetCommunityMembersDocument, { communityID, limit, offset }, getAdminToken());
};

const ListRoomMessagesDocument = graphql(`
  query AdminListMessages($roomID: ID!, $limit: Int, $before: ID) {
    messages(roomID: $roomID, limit: $limit, before: $before) {
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
      }
      hasMoreBefore
    }
  }
`);

export const promoteToCommunityOwner = async (communityID: string, userID: string) => {
  return await requestDoc(UpdateCommunityMembersDocument, { communityID, updates: [{ userID, action: 'PROMOTE' }] }, getAdminToken());
};

export const demoteFromCommunityOwner = async (communityID: string, userID: string) => {
  return await requestDoc(UpdateCommunityMembersDocument, { communityID, updates: [{ userID, action: 'DEMOTE' }] }, getAdminToken());
};

const DeleteMessageDocument = graphql(`
  mutation DeleteMessage($roomID: ID!, $id: ID!) {
    deleteMessage(roomID: $roomID, id: $id)
  }
`);

// adminMessagePageSize は管理画面が一度に読むメッセージ数。
//
// 以前は 200 件を一度に取り、ページ送りを持っていなかった。ルームが育つほど
// 1回の応答が重くなり、しかも 200 件を超えたぶんは管理画面から一切辿れなかった
// （古いメッセージを見る手段が無かった）。
export const adminMessagePageSize = 50;

/**
 * ルームのメッセージを新しい側から1ページぶん読む。
 *
 * before には「いま持っている中で一番古いメッセージのID」を渡す。offset ではなく
 * カーソルなのは、messages が元からカーソル方式だから（深いページでも費用が
 * 増えず、読んでいる間に新着が入っても取りこぼし・重複が起きない）。
 *
 * items は常に古い順で返る。hasMoreBefore は「このページより古いメッセージが
 * まだあるか」の実測値。
 */
export const listRoomMessages = async (
  roomID: string,
  limit = adminMessagePageSize,
  before?: string,
): Promise<{ messages: { items: Message[]; hasMoreBefore: boolean } }> => {
  const data = await requestDoc(
    ListRoomMessagesDocument,
    { roomID, limit, ...(before ? { before } : {}) },
    getAdminToken(),
  );
  return data as { messages: { items: Message[]; hasMoreBefore: boolean } };
};

export const adminDeleteMessage = async (roomID: string, messageID: string) => {
  return await requestDoc(DeleteMessageDocument, { roomID, id: messageID }, getAdminToken());
};
