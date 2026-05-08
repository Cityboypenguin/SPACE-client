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
  image: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
};

type UsersResponse = { users: User[] };
type SearchUsersResponse = { searchUsers: User[] };
type GetUserByIDResponse = { getUserByID: User };
type DeleteUserResponse = { deleteUser: boolean };
type AdminUpdateUserResponse = { adminUpdateUser: User };
type GetProfileByUserIDResponse = { getProfileByUserID: Profile | null };

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

export const adminUpdateUser = async (
  id: string,
  input: { accountID?: string; name?: string; email?: string; password?: string },
) => {
  return await request<AdminUpdateUserResponse>(ADMIN_UPDATE_USER_MUTATION, { id, input }, getAdminToken());
};

export const getProfileByUserID = async (userID: string) => {
  return await request<GetProfileByUserIDResponse>(GET_PROFILE_BY_USER_ID_QUERY, { userID }, getAdminToken());
};
