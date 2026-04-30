import { request } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from './auth';

export type UserProfile = {
  ID: string;
  accountID: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  username: string;
  bio: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserProfile;
};

type MeResponse = { me: UserProfile };
type SearchUsersResponse = { searchUsers: UserProfile[] };
type UpdateUserResponse = { updateUser: UserProfile };
type GetProfileByUserIDResponse = { getProfileByUserID: Profile | null };
type UpdateProfileResponse = { updateProfile: Profile };

const ME_QUERY = `
  query Me {
    me {
      ID
      accountID
      name
      email
      role
      status
      createdAt
      updatedAt
    }
  }
`;

const SEARCH_USERS_QUERY = `
  query SearchUsers($name: String!) {
    searchUsers(name: $name) {
      ID
      accountID
      name
      email
      role
      status
    }
  }
`;

const UPDATE_USER_MUTATION = `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      ID
      accountID
      name
      email
      role
      status
      createdAt
      updatedAt
    }
  }
`;

const GET_PROFILE_BY_USER_ID_QUERY = `
  query GetProfileByUserID($userID: ID!) {
    getProfileByUserID(userID: $userID) {
      username
      bio
      image
      createdAt
      updatedAt
      user {
        ID
        accountID
        name
        email
        role
        status
      }
    }
  }
`;

const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      username
      bio
      image
      createdAt
      updatedAt
    }
  }
`;

const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

export const getMyProfile = async () => {
  const token = getUserToken();
  if (!token) {
    throw new Error('認証が必要です。ログインしてください。');
  }
  return await request<MeResponse>(ME_QUERY, undefined, token);
};

export const updateMyProfile = async (input: {
  accountID?: string;
  name?: string;
  email?: string;
  password?: string;
}) => {
  return await request<UpdateUserResponse>(UPDATE_USER_MUTATION, { input }, getUserToken());
};

export const searchUsers = async (name: string) => {
  return await request<SearchUsersResponse>(SEARCH_USERS_QUERY, { name }, getUserToken());
};

export const getProfileByUserID = async (userID: string) => {
  return await request<GetProfileByUserIDResponse>(
    GET_PROFILE_BY_USER_ID_QUERY,
    { userID },
    getUserToken(),
  );
};

export const updateProfile = async (input: {
  userID: string;
  username?: string;
  bio?: string;
  image?: string;
}) => {
  return await request<UpdateProfileResponse>(UPDATE_PROFILE_MUTATION, { input }, getUserToken());
};
