import { request } from '../../../lib/graphql';
import { getUserToken } from './auth';

export type User = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export type FavoriteUser = {
  ID: string;
  userID: string;
  favoriteUserID: string;
  createdAt: string;
};

const USER_FIELDS = `
  ID
  name
  accountID
  avatarUrl
`;

const GET_FAVORITE_USERS_BY_USER_ID_QUERY = `
  query GetFavoriteUsersByUserID($userID: ID!) {
    GetFavoriteUsersByUserID(userID: $userID) {
      ${USER_FIELDS}
    }
  }
`;

const CREATE_FAVORITE_USER_MUTATION = `
  mutation CreateFavoriteUser($favoriteUserID: ID!) {
    createFavoriteUser(favoriteUserID: $favoriteUserID) {
      ID
      userID
      favoriteUserID
      createdAt
    }
  }
`;

const DELETE_FAVORITE_USER_MUTATION = `
  mutation DeleteFavoriteUser($favoriteUserID: ID!) {
    deleteFavoriteUser(favoriteUserID: $favoriteUserID)
  }
`;

const LIST_FAVORITE_USERS_QUERY = `
  query ListFavoriteUsers($limit: Int, $offset: Int) {
    listFavoriteUsers(limit: $limit, offset: $offset) {
      items {
        ${USER_FIELDS}
      }
      total
    }
  }
`;

const MY_FOLLOWERS_QUERY = `
  query MyFollowers($limit: Int, $offset: Int) {
    myFollowers(limit: $limit, offset: $offset) {
      items {
        ${USER_FIELDS}
      }
      total
    }
  }
`;

export const getFavoriteUsersByUserID = async (userID: string): Promise<User[]> => {
  const data = await request<{ GetFavoriteUsersByUserID: User[] }>(
    GET_FAVORITE_USERS_BY_USER_ID_QUERY,
    { userID },
    getUserToken(),
  );
  return data.GetFavoriteUsersByUserID;
};

export const createFavoriteUser = async (favoriteUserID: string): Promise<FavoriteUser> => {
  const data = await request<{ createFavoriteUser: FavoriteUser }>(
    CREATE_FAVORITE_USER_MUTATION,
    { favoriteUserID },
    getUserToken(),
  );
  return data.createFavoriteUser;
};

export const deleteFavoriteUser = async (favoriteUserID: string): Promise<void> => {
  await request<{ deleteFavoriteUser: boolean }>(
    DELETE_FAVORITE_USER_MUTATION,
    { favoriteUserID },
    getUserToken(),
  );
};

export type UserPage = { items: User[]; total: number };

export const listFavoriteUsers = async (limit = 20, offset = 0): Promise<UserPage> => {
  const data = await request<{ listFavoriteUsers: UserPage }>(
    LIST_FAVORITE_USERS_QUERY,
    { limit, offset },
    getUserToken(),
  );
  return data.listFavoriteUsers;
};

export const listMyFollowers = async (limit = 20, offset = 0): Promise<UserPage> => {
  const data = await request<{ myFollowers: UserPage }>(
    MY_FOLLOWERS_QUERY,
    { limit, offset },
    getUserToken(),
  );
  return data.myFollowers;
};
