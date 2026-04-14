import { request } from '../../../lib/graphql';
import { USER_TOKEN_KEY } from './auth';

export type UserProfile = {
  ID: string;
  userID: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type GetUserByIDResponse = { getUserByID: UserProfile };
type SearchUsersResponse = { searchUsers: UserProfile[] };
type UpdateUserResponse = { updateUser: UserProfile };
type DeleteUserResponse = { deleteUser: boolean };

const GET_USER_BY_ID_QUERY = `
  query GetUserByID($id: ID!) {
    getUserByID(id: $id) {
      ID
      userID
      name
      email
      role
      status
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_USER_MUTATION = `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      ID
      userID
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
      userID
      name
      email
      role
      status
    }
  }
`;

const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

export const searchUsers = async (name: string) => {
  return await request<SearchUsersResponse>(SEARCH_USERS_QUERY, { name }, getUserToken());
};

export const getUserByID = async (id: string) => {
  return await request<GetUserByIDResponse>(GET_USER_BY_ID_QUERY, { id }, getUserToken());
};

export const getMyProfile = async (id: string) => {
  return await request<GetUserByIDResponse>(GET_USER_BY_ID_QUERY, { id }, getUserToken());
};

export const updateMyProfile = async (input: {
  ID: string;
  userID?: string;
  name?: string;
  email?: string;
  password?: string;
}) => {
  return await request<UpdateUserResponse>(UPDATE_USER_MUTATION, { input }, getUserToken());
};

export const deleteMyAccount = async (id: string) => {
  return await request<DeleteUserResponse>(DELETE_USER_MUTATION, { id }, getUserToken());
};
