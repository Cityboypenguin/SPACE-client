import { request } from '../../../lib/graphql';

const ADMIN_TOKEN_KEY = 'space_admin_token';

export type User = {
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
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
};

type UsersResponse = { users: User[] };
type SearchUsersResponse = { searchUsers: User[] };
type GetUserByIDResponse = { getUserByID: User };
type DeleteUserResponse = { deleteUser: boolean };
type FreezeUserResponse = { freezeUser: boolean };
type UnfreezeUserResponse = { unfreezeUser: boolean };
type AdminUpdateUserResponse = { adminUpdateUser: User };
type GetProfileByUserIDResponse = { getProfileByUserID: Profile | null };
type AdminUpdateProfileResponse = { adminUpdateProfile: Profile };

const USERS_QUERY = `
  query {
    users {
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
      createdAt
      updatedAt
    }
  }
`;

const GET_USER_BY_ID_QUERY = `
  query GetUserByID($id: ID!) {
    getUserByID(id: $id) {
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

const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

const FREEZE_USER_MUTATION = `
  mutation FreezeUser($id: ID!) {
    freezeUser(id: $id)
  }
`;

const UNFREEZE_USER_MUTATION = `
  mutation UnfreezeUser($id: ID!) {
    unfreezeUser(id: $id)
  }
`;

const ADMIN_UPDATE_USER_MUTATION = `
  mutation AdminUpdateUser($id: ID!, $input: UpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
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

const ADMIN_UPDATE_PROFILE_MUTATION = `
  mutation AdminUpdateProfile($userID: ID!, $input: UpdateProfileInput!) {
    adminUpdateProfile(userID: $userID, input: $input) {
      username
      bio
      avatarUrl
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

const GET_PROFILE_BY_USER_ID_QUERY = `
  query GetProfileByUserID($userID: ID!) {
    getProfileByUserID(userID: $userID) {
      username
      bio
      avatarUrl
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

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export const getUsers = async () => {
  return await request<UsersResponse>(USERS_QUERY, undefined, getAdminToken());
};

export const searchUsers = async (name: string) => {
  return await request<SearchUsersResponse>(SEARCH_USERS_QUERY, { name }, getAdminToken());
};

export const getUserByID = async (id: string) => {
  return await request<GetUserByIDResponse>(GET_USER_BY_ID_QUERY, { id }, getAdminToken());
};

export const deleteUser = async (id: string) => {
  return await request<DeleteUserResponse>(DELETE_USER_MUTATION, { id }, getAdminToken());
};

export const freezeUser = async (id: string) => {
  return await request<FreezeUserResponse>(FREEZE_USER_MUTATION, { id }, getAdminToken());
};

export const unfreezeUser = async (id: string) => {
  return await request<UnfreezeUserResponse>(UNFREEZE_USER_MUTATION, { id }, getAdminToken());
};

export const adminUpdateUser = async (
  id: string,
  input: { accountID?: string; name?: string; email?: string; password?: string },
) => {
  return await request<AdminUpdateUserResponse>(ADMIN_UPDATE_USER_MUTATION, { id, input }, getAdminToken());
};

export const getProfileByUserID = async (userID: string) => {
  return await request<GetProfileByUserIDResponse>(GET_PROFILE_BY_USER_ID_QUERY, { userID }, getAdminToken());
};

export const adminUpdateProfile = async (
  userID: string,
  input: { bio?: string },
) => {
  return await request<AdminUpdateProfileResponse>(
    ADMIN_UPDATE_PROFILE_MUTATION,
    { userID, input },
    getAdminToken(),
  );
};
