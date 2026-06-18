import { request } from '../../../lib/graphql';
import { ADMIN_TOKEN_KEY } from './auth';
import type { User } from './users';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

const USER_FIELDS = `
  ID
  name
  accountID
  avatarUrl
`;

const ADMIN_GET_BLOCKERS_QUERY = `
  query AdminGetBlockers($userID: ID!) {
    adminGetBlockers(userID: $userID) {
      ${USER_FIELDS}
    }
  }
`;

const ADMIN_GET_FAVORITE_USERS_QUERY = `
  query AdminGetFavoriteUsers($userID: ID!) {
    adminGetFavoriteUsers(userID: $userID) {
      ${USER_FIELDS}
    }
  }
`;

export const adminGetBlockers = async (userID: string): Promise<User[]> => {
  const data = await request<{ adminGetBlockers: User[] }>(
    ADMIN_GET_BLOCKERS_QUERY,
    { userID },
    getAdminToken(),
  );
  return data.adminGetBlockers;
};

export const adminGetFavoriteUsers = async (userID: string): Promise<User[]> => {
  const data = await request<{ adminGetFavoriteUsers: User[] }>(
    ADMIN_GET_FAVORITE_USERS_QUERY,
    { userID },
    getAdminToken(),
  );
  return data.adminGetFavoriteUsers;
};