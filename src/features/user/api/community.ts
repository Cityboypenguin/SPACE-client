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

export const leaveCommunity = async (roomID: string, accountID: string): Promise<void> => {
  await request<{ removeUserFromRoom: boolean }>(
    REMOVE_USER_FROM_ROOM_MUTATION,
    { input: { roomID, accountID } },
    getUserToken(),
  );
};
