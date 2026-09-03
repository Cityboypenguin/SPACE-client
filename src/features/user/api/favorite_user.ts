import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
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

const GetFavoriteUsersByUserIDDocument = graphql(`
  query GetFavoriteUsersByUserID($userID: ID!) {
    GetFavoriteUsersByUserID(userID: $userID) {
      ID
      name
      accountID
      avatarUrl
    }
  }
`);

const CreateFavoriteUserDocument = graphql(`
  mutation CreateFavoriteUser($favoriteUserID: ID!) {
    createFavoriteUser(favoriteUserID: $favoriteUserID) {
      ID
      userID
      favoriteUserID
      createdAt
    }
  }
`);

const DeleteFavoriteUserDocument = graphql(`
  mutation DeleteFavoriteUser($favoriteUserID: ID!) {
    deleteFavoriteUser(favoriteUserID: $favoriteUserID)
  }
`);

const ListFavoriteUsersDocument = graphql(`
  query ListFavoriteUsers($limit: Int, $offset: Int) {
    listFavoriteUsers(limit: $limit, offset: $offset) {
      items {
        ID
        name
        accountID
        avatarUrl
      }
      total
    }
  }
`);

const MyFollowersDocument = graphql(`
  query MyFollowers($limit: Int, $offset: Int) {
    myFollowers(limit: $limit, offset: $offset) {
      items {
        ID
        name
        accountID
        avatarUrl
      }
      total
    }
  }
`);

export const getFavoriteUsersByUserID = async (userID: string): Promise<User[]> => {
  const data = await requestDoc(GetFavoriteUsersByUserIDDocument, { userID }, getUserToken());
  return data.GetFavoriteUsersByUserID;
};

export const createFavoriteUser = async (favoriteUserID: string): Promise<FavoriteUser> => {
  const data = await requestDoc(CreateFavoriteUserDocument, { favoriteUserID }, getUserToken());
  return data.createFavoriteUser;
};

export const deleteFavoriteUser = async (favoriteUserID: string): Promise<void> => {
  await requestDoc(DeleteFavoriteUserDocument, { favoriteUserID }, getUserToken());
};

export type UserPage = { items: User[]; total: number };

export const listFavoriteUsers = async (limit = 20, offset = 0): Promise<UserPage> => {
  const data = await requestDoc(ListFavoriteUsersDocument, { limit, offset }, getUserToken());
  return data.listFavoriteUsers;
};

export const listMyFollowers = async (limit = 20, offset = 0): Promise<UserPage> => {
  const data = await requestDoc(MyFollowersDocument, { limit, offset }, getUserToken());
  return data.myFollowers;
};
