import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { storageUrl } from '../../../lib/storage';
import { getUserToken } from './auth';

export type UserProfile = {
  ID: string;
  accountID: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Profile = {
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserProfile;
};

type SearchUsersPage = { items: UserProfile[]; total: number };

const MeDocument = graphql(`
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
`);

const SearchUsersDocument = graphql(`
  query SearchUsers($keyword: String!, $limit: Int, $offset: Int) {
    searchUsers(keyword: $keyword, limit: $limit, offset: $offset) {
      items {
        ID
        accountID
        name
        email
        role
        status
        avatarUrl
        createdAt
        updatedAt
      }
      total
    }
  }
`);

const UpdateUserDocument = graphql(`
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
`);

const PresignedAvatarUploadUrlDocument = graphql(`
  query PresignedAvatarUploadUrl($contentType: String!) {
    presignedAvatarUploadUrl(contentType: $contentType) {
      uploadUrl
      objectKey
    }
  }
`);

const SetAvatarDocument = graphql(`
  mutation SetAvatar($objectKey: String!) {
    setAvatar(objectKey: $objectKey) {
      username
      bio
      avatarUrl
      createdAt
      updatedAt
    }
  }
`);

const DeleteAvatarDocument = graphql(`
  mutation DeleteAvatar {
    deleteAvatar {
      username
      bio
      avatarUrl
      createdAt
      updatedAt
    }
  }
`);

const DeleteMyAccountDocument = graphql(`
  mutation DeleteMyAccount {
    deleteMyAccount
  }
`);

const GetProfileByUserIDDocument = graphql(`
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
        avatarUrl
        createdAt
        updatedAt
      }
    }
  }
`);

const UpdateProfileDocument = graphql(`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      username
      bio
      avatarUrl
      createdAt
      updatedAt
    }
  }
`);

export const getMyProfile = async () => {
  const token = getUserToken();
  if (!token) {
    throw new Error('認証が必要です。ログインしてください。');
  }
  return await requestDoc(MeDocument, {}, token);
};

export const updateMyProfile = async (input: {
  accountID?: string;
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}) => {
  return await requestDoc(UpdateUserDocument, { input }, getUserToken());
};

export const searchUsers = async (keyword: string, limit = 20, offset = 0): Promise<SearchUsersPage> => {
  const data = await requestDoc(SearchUsersDocument, { keyword, limit, offset }, getUserToken());
  return data.searchUsers;
};

export const getProfileByUserID = async (userID: string) => {
  return await requestDoc(GetProfileByUserIDDocument, { userID }, getUserToken());
};

export const updateProfile = async (input: {
  username?: string;
  bio?: string;
}) => {
  return await requestDoc(UpdateProfileDocument, { input }, getUserToken());
};

export const getPresignedAvatarUploadUrl = async (contentType: string) => {
  const token = getUserToken();
  if (!token) throw new Error('認証が必要です。');
  return await requestDoc(PresignedAvatarUploadUrlDocument, { contentType }, token);
};

export const uploadAvatarToStorage = async (uploadUrl: string, file: File): Promise<void> => {
  const res = await fetch(storageUrl(uploadUrl) ?? uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('画像のアップロードに失敗しました。');
};

export const setAvatar = async (objectKey: string) => {
  const token = getUserToken();
  if (!token) throw new Error('認証が必要です。');
  return await requestDoc(SetAvatarDocument, { objectKey }, token);
};

export const deleteAvatar = async () => {
  const token = getUserToken();
  if (!token) throw new Error('認証が必要です。');
  return await requestDoc(DeleteAvatarDocument, {}, token);
};

export const deleteMyAccount = async (): Promise<boolean> => {
  const token = getUserToken();
  if (!token) throw new Error('認証が必要です。');
  const data = await requestDoc(DeleteMyAccountDocument, {}, token);
  return data.deleteMyAccount;
};
