import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
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
  media: { ID: string; url: string; contentType: string }[];
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

export type RoomUser = {
  ID: string;
  accountID: string;
  name: string;
  email: string;
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

const KickUserFromCommunityDocument = graphql(`
  mutation KickUserFromCommunity($communityID: ID!, $userID: ID!) {
    kickUserFromCommunity(communityID: $communityID, userID: $userID)
  }
`);

const GetRoomDocument = graphql(`
  query AdminGetRoom($id: ID!) {
    room(id: $id) {
      ID
      name
      user {
        ID
        accountID
        name
        email
      }
    }
  }
`);

const GetCommunityMembersDocument = graphql(`
  query AdminGetCommunityMembers($communityID: ID!) {
    getCommunityMembers(communityID: $communityID) {
      user {
        ID
        accountID
        name
        email
      }
      role
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
  return await requestDoc(KickUserFromCommunityDocument, { communityID, userID }, getAdminToken());
};

export const getCommunityRoom = async (roomID: string) => {
  return await requestDoc(GetRoomDocument, { id: roomID }, getAdminToken());
};

export const getCommunityMembers = async (communityID: string) => {
  return await requestDoc(GetCommunityMembersDocument, { communityID }, getAdminToken());
};

const ListRoomMessagesDocument = graphql(`
  query AdminListMessages($roomID: ID!, $limit: Int) {
    messages(roomID: $roomID, limit: $limit) {
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
    }
  }
`);

const PromoteToCommunityOwnerDocument = graphql(`
  mutation PromoteToCommunityOwner($communityID: ID!, $userID: ID!) {
    promoteToCommunityOwner(communityID: $communityID, userID: $userID)
  }
`);

const DemoteFromCommunityOwnerDocument = graphql(`
  mutation DemoteFromCommunityOwner($communityID: ID!, $userID: ID!) {
    demoteFromCommunityOwner(communityID: $communityID, userID: $userID)
  }
`);

export const promoteToCommunityOwner = async (communityID: string, userID: string) => {
  return await requestDoc(PromoteToCommunityOwnerDocument, { communityID, userID }, getAdminToken());
};

export const demoteFromCommunityOwner = async (communityID: string, userID: string) => {
  return await requestDoc(DemoteFromCommunityOwnerDocument, { communityID, userID }, getAdminToken());
};

const DeleteMessageDocument = graphql(`
  mutation DeleteMessage($roomID: ID!, $id: ID!) {
    deleteMessage(roomID: $roomID, id: $id)
  }
`);

export const listRoomMessages = async (roomID: string, limit = 200): Promise<{ messages: { items: Message[] } }> => {
  const data = await requestDoc(ListRoomMessagesDocument, { roomID, limit }, getAdminToken());
  return data as { messages: { items: Message[] } };
};

export const adminDeleteMessage = async (roomID: string, messageID: string) => {
  return await requestDoc(DeleteMessageDocument, { roomID, id: messageID }, getAdminToken());
};
