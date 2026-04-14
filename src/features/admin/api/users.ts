import { request } from '../../../lib/graphql';

const ADMIN_TOKEN_KEY = 'space_admin_token';

export type User = {
  ID: string;
  userID: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type UsersResponse = { users: User[] };
type GetUserByIDResponse = { getUserByID: User };
type UpdateUserResponse = { updateUser: User };
type DeleteUserResponse = { deleteUser: boolean };

const USERS_QUERY = `
  query {
    users {
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

const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export const getUsers = async () => {
  return await request<UsersResponse>(USERS_QUERY, undefined, getAdminToken());
};

export const getUserByID = async (id: string) => {
  return await request<GetUserByIDResponse>(GET_USER_BY_ID_QUERY, { id }, getAdminToken());
};

export const updateUser = async (input: {
  ID: string;
  userID?: string;
  name?: string;
  email?: string;
  password?: string;
}) => {
  return await request<UpdateUserResponse>(UPDATE_USER_MUTATION, { input }, getAdminToken());
};

export const deleteUser = async (id: string) => {
  return await request<DeleteUserResponse>(DELETE_USER_MUTATION, { id }, getAdminToken());
};
