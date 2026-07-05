import { request, requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

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
  // getProfileByUserID/adminUpdateProfile は user の createdAt/updatedAt を取得しないため、
  // フル User 型ではなくこのサブセットのみを保証する。
  user: {
    ID: string;
    accountID: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
};

export type UserPage = { items: User[]; total: number };
type AdminCreateUserResponse = { adminCreateUser: User };

const UsersDocument = graphql(`
  query Users($limit: Int, $offset: Int) {
    users(limit: $limit, offset: $offset) {
      items {
        ID
        accountID
        name
        email
        role
        status
        createdAt
        updatedAt
      }
      total
    }
  }
`);

const SearchUsersDocument = graphql(`
  query AdminSearchUsers($keyword: String!) {
    searchUsers(keyword: $keyword) {
      items {
        ID
        accountID
        name
        email
        role
        status
        createdAt
        updatedAt
      }
      total
    }
  }
`);

const GetUserByIDDocument = graphql(`
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
`);

const DeleteUserDocument = graphql(`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`);

const FreezeUserDocument = graphql(`
  mutation FreezeUser($id: ID!) {
    freezeUser(id: $id)
  }
`);

const UnfreezeUserDocument = graphql(`
  mutation UnfreezeUser($id: ID!) {
    unfreezeUser(id: $id)
  }
`);

const AdminUpdateUserDocument = graphql(`
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
`);

const AdminUpdateProfileDocument = graphql(`
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
`);

// TODO: バックエンドのスキーマ反映後に TypedDocumentNode へ移行する。
const ADMIN_CREATE_USER_MUTATION = `
  mutation AdminCreateUser($input: AdminCreateUserInput!) {
    adminCreateUser(input: $input) {
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

const GetProfileByUserIDDocument = graphql(`
  query AdminGetProfileByUserID($userID: ID!) {
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
`);

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

export const getUsers = async (limit = 20, offset = 0) => {
  return await requestDoc(UsersDocument, { limit, offset }, getAdminToken());
};

export const searchUsers = async (keyword: string) => {
  return await requestDoc(SearchUsersDocument, { keyword }, getAdminToken());
};

export const getUserByID = async (id: string) => {
  return await requestDoc(GetUserByIDDocument, { id }, getAdminToken());
};

export const deleteUser = async (id: string) => {
  return await requestDoc(DeleteUserDocument, { id }, getAdminToken());
};

export const freezeUser = async (id: string) => {
  return await requestDoc(FreezeUserDocument, { id }, getAdminToken());
};

export const unfreezeUser = async (id: string) => {
  return await requestDoc(UnfreezeUserDocument, { id }, getAdminToken());
};

export const adminUpdateUser = async (
  id: string,
  input: { accountID: string; name: string; email: string; password?: string },
) => {
  return await requestDoc(AdminUpdateUserDocument, { id, input }, getAdminToken());
};

export const adminCreateUser = async (input: {
  accountID: string;
  name: string;
  email: string;
  password: string;
}) => {
  return await request<AdminCreateUserResponse>(ADMIN_CREATE_USER_MUTATION, { input }, getAdminToken());
};

export const getProfileByUserID = async (userID: string) => {
  return await requestDoc(GetProfileByUserIDDocument, { userID }, getAdminToken());
};

export const adminUpdateProfile = async (
  userID: string,
  input: { bio?: string },
) => {
  return await requestDoc(AdminUpdateProfileDocument, { userID, input }, getAdminToken());
};
