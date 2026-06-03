import { request } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from './auth';

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

const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

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