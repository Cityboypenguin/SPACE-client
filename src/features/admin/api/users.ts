import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

// 管理画面のユーザー台帳。GraphQL の UserAccount（User + email）に対応する。
// email が付くのは users / adminSearchUsers / getUserByID / adminUpdateUser など
// 管理者しか辿れない口だけなので、公開型の User を引く画面では使わないこと。
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
  // Profile.user は GraphQL 上は公開型の User なので email を持たない。
  // 管理画面で email が要るときは getUserByID（UserAccount）から取ること。
  // createdAt/updatedAt も取得していないため、このサブセットのみを保証する。
  user: {
    ID: string;
    accountID: string;
    name: string;
    role: string;
    status: string;
  };
};

export type UserPage = { items: User[]; total: number };

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

// 管理画面のユーザー検索は adminSearchUsers を使う。一般ユーザー向けの
// searchUsers は公開型の User（email を持たない）を返すため、管理者向けの
// 台帳表示に必要な email は adminSearchUsers（UserAccount）からしか取れない。
const SearchUsersDocument = graphql(`
  query AdminSearchUsers($keyword: String!) {
    adminSearchUsers(keyword: $keyword) {
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
        role
        status
      }
    }
  }
`);

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

export const getProfileByUserID = async (userID: string) => {
  return await requestDoc(GetProfileByUserIDDocument, { userID }, getAdminToken());
};

export const adminUpdateProfile = async (
  userID: string,
  input: { bio?: string },
) => {
  return await requestDoc(AdminUpdateProfileDocument, { userID, input }, getAdminToken());
};
