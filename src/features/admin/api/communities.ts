import { request } from '../../../lib/graphql';
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

const COMMUNITIES_QUERY = `
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
`;

const UPDATE_COMMUNITY_MUTATION = `
  mutation UpdateCommunity($id: ID!, $input: UpdateCommunityInput!) {
    updateCommunity(id: $id, input: $input) {
      ID
      roomID
      name
      description
      createdAt
      updatedAt
    }
  }
`;

const KICK_USER_MUTATION = `
  mutation KickUserFromCommunity($communityID: ID!, $userID: ID!) {
    kickUserFromCommunity(communityID: $communityID, userID: $userID)
  }
`;

const GET_ROOM_QUERY = `
  query GetRoom($id: ID!) {
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
`;

const GET_COMMUNITY_MEMBERS_QUERY = `
  query GetCommunityMembers($communityID: ID!) {
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
`;

export const getCommunities = async (limit = 20, offset = 0) => {
  return await request<{ communities: CommunityPage }>(COMMUNITIES_QUERY, { limit, offset }, getAdminToken());
};

export const updateCommunity = async (
  id: string,
  input: { name?: string; description?: string },
) => {
  return await request<{ updateCommunity: Community }>(
    UPDATE_COMMUNITY_MUTATION,
    { id, input },
    getAdminToken(),
  );
};

export const kickUserFromCommunity = async (communityID: string, userID: string) => {
  return await request<{ kickUserFromCommunity: boolean }>(
    KICK_USER_MUTATION,
    { communityID, userID },
    getAdminToken(),
  );
};

export const getCommunityRoom = async (roomID: string) => {
  return await request<{ room: Room | null }>(GET_ROOM_QUERY, { id: roomID }, getAdminToken());
};

export const getCommunityMembers = async (communityID: string) => {
  return await request<{ getCommunityMembers: CommunityMember[] }>(
    GET_COMMUNITY_MEMBERS_QUERY,
    { communityID },
    getAdminToken(),
  );
};

const LIST_ROOM_MESSAGES_QUERY = `
  query ListMessages($roomID: ID!, $limit: Int) {
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
`;

const PROMOTE_TO_OWNER_MUTATION = `
  mutation PromoteToCommunityOwner($communityID: ID!, $userID: ID!) {
    promoteToCommunityOwner(communityID: $communityID, userID: $userID)
  }
`;

const DEMOTE_FROM_OWNER_MUTATION = `
  mutation DemoteFromCommunityOwner($communityID: ID!, $userID: ID!) {
    demoteFromCommunityOwner(communityID: $communityID, userID: $userID)
  }
`;

export const promoteToCommunityOwner = async (communityID: string, userID: string) => {
  return await request<{ promoteToCommunityOwner: boolean }>(
    PROMOTE_TO_OWNER_MUTATION,
    { communityID, userID },
    getAdminToken(),
  );
};

export const demoteFromCommunityOwner = async (communityID: string, userID: string) => {
  return await request<{ demoteFromCommunityOwner: boolean }>(
    DEMOTE_FROM_OWNER_MUTATION,
    { communityID, userID },
    getAdminToken(),
  );
};

const DELETE_MESSAGE_MUTATION = `
  mutation DeleteMessage($roomID: ID!, $id: ID!) {
    deleteMessage(roomID: $roomID, id: $id)
  }
`;

export const listRoomMessages = async (roomID: string, limit = 200) => {
  return await request<{ messages: { items: Message[] } }>(
    LIST_ROOM_MESSAGES_QUERY,
    { roomID, limit },
    getAdminToken(),
  );
};

export const adminDeleteMessage = async (roomID: string, messageID: string) => {
  return await request<{ deleteMessage: boolean }>(
    DELETE_MESSAGE_MUTATION,
    { roomID, id: messageID },
    getAdminToken(),
  );
};
