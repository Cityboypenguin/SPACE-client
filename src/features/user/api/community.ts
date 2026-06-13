import { request } from '../../../lib/graphql';
import { getUserToken } from './auth';

export type Community = {
  ID: string;
  roomID: string;
  name: string;
  description: string;
  avatarURL: string;
  memberCount: number;
  isMember: boolean;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CommunityMember = {
  user: {
    ID: string;
    accountID: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  role: string;
};

const MY_COMMUNITIES_QUERY = `
  query MyCommunities($limit: Int, $offset: Int) {
    myCommunities(limit: $limit, offset: $offset) {
      items {
        ID
        roomID
        name
        description
        avatarURL
        memberCount
        isMember
        unreadCount
        createdAt
        updatedAt
      }
      total
    }
  }
`;

const SEARCH_COMMUNITIES_QUERY = `
  query SearchCommunities($name: String!, $limit: Int, $offset: Int) {
    searchCommunities(name: $name, limit: $limit, offset: $offset) {
      items {
        ID
        roomID
        name
        description
        avatarURL
        memberCount
        isMember
        createdAt
        updatedAt
      }
      total
    }
  }
`;

const CREATE_COMMUNITY_MUTATION = `
  mutation CreateCommunity($input: CreateCommunityInput!) {
    createCommunity(input: $input) {
      ID
      roomID
      name
      description
      avatarURL
      memberCount
      isMember
      createdAt
      updatedAt
    }
  }
`;

const JOIN_ROOM_MUTATION = `
  mutation JoinRoom($roomID: ID!) {
    joinRoom(roomID: $roomID)
  }
`;

const REMOVE_USER_FROM_ROOM_MUTATION = `
  mutation RemoveUserFromRoom($input: RemoveUserFromRoomInput!) {
    removeUserFromRoom(input: $input)
  }
`;

const GET_MY_ROLE_IN_COMMUNITY_QUERY = `
  query GetMyRoleInCommunity($communityID: ID!) {
    getMyRoleInCommunity(communityID: $communityID)
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
        avatarUrl
      }
      role
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
      avatarURL
      memberCount
      isMember
      createdAt
      updatedAt
    }
  }
`;

const KICK_USER_FROM_COMMUNITY_MUTATION = `
  mutation KickUserFromCommunity($communityID: ID!, $userID: ID!) {
    kickUserFromCommunity(communityID: $communityID, userID: $userID)
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

const UPDATE_COMMUNITY_MEMBERS_MUTATION = `
  mutation UpdateCommunityMembers($communityID: ID!, $updates: [CommunityMemberUpdateInput!]!) {
    updateCommunityMembers(communityID: $communityID, updates: $updates)
  }
`;

const RANDOM_COMMUNITIES_QUERY = `
  query RandomCommunities($limit: Int!) {
    randomCommunities(limit: $limit) {
      ID
      roomID
      name
      description
      avatarURL
      memberCount
      isMember
      createdAt
      updatedAt
    }
  }
`;

const PRESIGNED_COMMUNITY_ICON_UPLOAD_URL_QUERY = `
  query PresignedCommunityIconUploadUrl($contentType: String!) {
    presignedCommunityIconUploadUrl(contentType: $contentType) {
      uploadUrl
      objectKey
    }
  }
`;

export type CommunityMemberAction = 'PROMOTE' | 'DEMOTE' | 'KICK';

export type CommunityMemberUpdateInput = {
  userID: string;
  action: CommunityMemberAction;
};

export type CommunityPage = {
  items: Community[];
  total: number;
};

export const listMyCommunities = async (limit = 20, offset = 0): Promise<CommunityPage> => {
  const data = await request<{ myCommunities: CommunityPage }>(
    MY_COMMUNITIES_QUERY,
    { limit, offset },
    getUserToken(),
  );
  return data.myCommunities;
};

export const searchCommunities = async (name: string, limit = 20, offset = 0): Promise<CommunityPage> => {
  const data = await request<{ searchCommunities: CommunityPage }>(
    SEARCH_COMMUNITIES_QUERY,
    { name, limit, offset },
    getUserToken(),
  );
  return data.searchCommunities;
};

export const createCommunity = async (name: string, description: string, avatarKey: string): Promise<Community> => {
  const data = await request<{ createCommunity: Community }>(
    CREATE_COMMUNITY_MUTATION,
    { input: { name, description, avatarKey } },
    getUserToken(),
  );
  return data.createCommunity;
};

export const joinCommunity = async (roomID: string): Promise<void> => {
  await request<{ joinRoom: boolean }>(
    JOIN_ROOM_MUTATION,
    { roomID },
    getUserToken(),
  );
};

export const leaveCommunity = async (roomID: string, userID: string): Promise<void> => {
  await request<{ removeUserFromRoom: boolean }>(
    REMOVE_USER_FROM_ROOM_MUTATION,
    { input: { roomID, userID } },
    getUserToken(),
  );
};

export const getMyRoleInCommunity = async (communityID: string): Promise<string> => {
  const data = await request<{ getMyRoleInCommunity: string }>(
    GET_MY_ROLE_IN_COMMUNITY_QUERY,
    { communityID },
    getUserToken(),
  );
  return data.getMyRoleInCommunity;
};

export const getCommunityMembers = async (communityID: string): Promise<CommunityMember[]> => {
  const data = await request<{ getCommunityMembers: CommunityMember[] }>(
    GET_COMMUNITY_MEMBERS_QUERY,
    { communityID },
    getUserToken(),
  );
  return data.getCommunityMembers;
};

export const updateCommunityInfo = async (
  id: string,
  input: { name?: string; description?: string; avatarKey?: string },
): Promise<Community> => {
  const data = await request<{ updateCommunity: Community }>(
    UPDATE_COMMUNITY_MUTATION,
    { id, input },
    getUserToken(),
  );
  return data.updateCommunity;
};

export const kickUserFromCommunity = async (communityID: string, userID: string): Promise<void> => {
  await request<{ kickUserFromCommunity: boolean }>(
    KICK_USER_FROM_COMMUNITY_MUTATION,
    { communityID, userID },
    getUserToken(),
  );
};

export const promoteToCommunityOwner = async (communityID: string, userID: string): Promise<void> => {
  await request<{ promoteToCommunityOwner: boolean }>(
    PROMOTE_TO_OWNER_MUTATION,
    { communityID, userID },
    getUserToken(),
  );
};

export const demoteFromCommunityOwner = async (communityID: string, userID: string): Promise<void> => {
  await request<{ demoteFromCommunityOwner: boolean }>(
    DEMOTE_FROM_OWNER_MUTATION,
    { communityID, userID },
    getUserToken(),
  );
};

export const updateCommunityMembers = async (
  communityID: string,
  updates: CommunityMemberUpdateInput[],
): Promise<void> => {
  await request<{ updateCommunityMembers: boolean }>(
    UPDATE_COMMUNITY_MEMBERS_MUTATION,
    { communityID, updates },
    getUserToken(),
  );
};

export const getRandomCommunities = async (limit: number): Promise<Community[]> => {
  const data = await request<{ randomCommunities: Community[] }>(
    RANDOM_COMMUNITIES_QUERY,
    { limit },
    getUserToken(),
  );
  return data.randomCommunities;
};

export const getPresignedCommunityIconUploadUrl = async (contentType: string) => {
  const token = getUserToken();
  if (!token) throw new Error('認証が必要です。');
  
  return await request<{ presignedCommunityIconUploadUrl: { uploadUrl: string; objectKey: string } }>(
    PRESIGNED_COMMUNITY_ICON_UPLOAD_URL_QUERY,
    { contentType },
    token,
  );
};
