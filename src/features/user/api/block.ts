import { request } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from './auth';

export type User = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export type Blocker = {
  ID: string;
  userID: string;
  blockedUserID: string;
  createdAt: string;
};

const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

const USER_FIELDS = `
  ID
  name
  accountID
  avatarUrl
`;

const GET_BLOCKERS_BY_USER_ID_QUERY = `
  query GetBlockersByUserID($userID: ID!) {
    GetBlockersByUserID(userID: $userID) {
      ${USER_FIELDS}
    }
  }
`;

const CREATE_BLOCKER_MUTATION = `
  mutation CreateBlocker($blockedUserID: ID!) {
    createBlocker(blockedUserID: $blockedUserID) {
      ID
      userID
      blockedUserID
      createdAt
    }
  }
`;

const DELETE_BLOCKER_MUTATION = `
  mutation DeleteBlocker($blockedUserID: ID!) {
    deleteBlocker(blockedUserID: $blockedUserID)
  }
`;

export const getBlockersByUserID = async (userID: string): Promise<User[]> => {
  const data = await request<{ GetBlockersByUserID: User[] }>(
    GET_BLOCKERS_BY_USER_ID_QUERY,
    { userID },
    getUserToken(),
  );
  return data.GetBlockersByUserID;
};

export const createBlocker = async (blockedUserID: string): Promise<Blocker> => {
  const data = await request<{ createBlocker: Blocker }>(
    CREATE_BLOCKER_MUTATION,
    { blockedUserID },
    getUserToken(),
  );
  return data.createBlocker;
};

export const deleteBlocker = async (blockedUserID: string): Promise<void> => {
  await request<{ deleteBlocker: boolean }>(
    DELETE_BLOCKER_MUTATION,
    { blockedUserID },
    getUserToken(),
  );
};