import { request } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from './auth';

export type Community = {
  ID: string;
  roomID: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityMember = {
  user: {
    ID: string;
    accountID: string;
    name: string;
    email: string;
  };
  role: string;
};

const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

const MY_COMMUNITIES_QUERY = `
  query MyCommunities {
    myCommunities {
      ID
      roomID
      name
      description
      createdAt
    }
  }
`;

const SEARCH_COMMUNITIES_QUERY = `
  query SearchCommunities($name: String!) {
    searchCommunities(name: $name) {
      ID
      roomID
      name
      description
      createdAt
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
      createdAt
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

export const listMyCommunities = async (): Promise<Community[]> => {
  const data = await request<{ myCommunities: Community[] }>(
    MY_COMMUNITIES_QUERY,
    undefined,
    getUserToken(),
  );
  return data.myCommunities;
};

export const searchCommunities = async (name: string): Promise<Community[]> => {
  const data = await request<{ searchCommunities: Community[] }>(
    SEARCH_COMMUNITIES_QUERY,
    { name },
    getUserToken(),
  );
  return data.searchCommunities;
};

export const createCommunity = async (name: string, description: string): Promise<Community> => {
  const data = await request<{ createCommunity: Community }>(
    CREATE_COMMUNITY_MUTATION,
    { input: { name, description } },
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
  input: { name?: string; description?: string },
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
