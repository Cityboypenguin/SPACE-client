import { request } from '../../../lib/graphql';
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

type MeResponse = { me: UserProfile };
type SearchUsersPage = { items: UserProfile[]; total: number };
type SearchUsersResponse = { searchUsers: SearchUsersPage };
type UpdateUserResponse = { updateUser: UserProfile };
type GetProfileByUserIDResponse = { getProfileByUserID: Profile | null };
type UpdateProfileResponse = { updateProfile: Profile };
type PresignedUploadUrlResponse = { presignedAvatarUploadUrl: { uploadUrl: string; objectKey: string } };
type SetAvatarResponse = { setAvatar: Profile };
type DeleteAvatarResponse = { deleteAvatar: Profile };
type DeleteMyAccountResponse = { deleteMyAccount: boolean };

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
      }
      total
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

const PRESIGNED_AVATAR_UPLOAD_URL_QUERY = `
  query PresignedAvatarUploadUrl($contentType: String!) {
    presignedAvatarUploadUrl(contentType: $contentType) {
      uploadUrl
      objectKey
    }
  }
`;

const SET_AVATAR_MUTATION = `
  mutation SetAvatar($objectKey: String!) {
    setAvatar(objectKey: $objectKey) {
      username
      bio
      avatarUrl
      createdAt
      updatedAt
    }
  }
`;

const DELETE_AVATAR_MUTATION = `
  mutation DeleteAvatar {
    deleteAvatar {
      username
      bio
      avatarUrl
      createdAt
      updatedAt
    }
  }
`;

const DELETE_MY_ACCOUNT_MUTATION = `
  mutation DeleteMyAccount {
    deleteMyAccount
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

const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      username
      bio
      avatarUrl
      createdAt
      updatedAt
    }
  }
`;

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

export const searchUsers = async (keyword: string, limit = 20, offset = 0): Promise<SearchUsersPage> => {
  const data = await request<SearchUsersResponse>(SEARCH_USERS_QUERY, { keyword, limit, offset }, getUserToken());
  return data.searchUsers;
};

export const getProfileByUserID = async (userID: string) => {
  return await request<GetProfileByUserIDResponse>(
    GET_PROFILE_BY_USER_ID_QUERY,
    { userID },
    getUserToken(),
  );
};

export const updateProfile = async (input: {
  username?: string;
  bio?: string;
}) => {
  return await request<UpdateProfileResponse>(UPDATE_PROFILE_MUTATION, { input }, getUserToken());
};

export const getPresignedAvatarUploadUrl = async (contentType: string) => {
  const token = getUserToken();
  if (!token) throw new Error('認証が必要です。');
  return await request<PresignedUploadUrlResponse>(
    PRESIGNED_AVATAR_UPLOAD_URL_QUERY,
    { contentType },
    token,
  );
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
  return await request<SetAvatarResponse>(SET_AVATAR_MUTATION, { objectKey }, token);
};

export const deleteAvatar = async () => {
  const token = getUserToken();
  if (!token) throw new Error('認証が必要です。');
  return await request<DeleteAvatarResponse>(DELETE_AVATAR_MUTATION, undefined, token);
};

export const deleteMyAccount = async (): Promise<boolean> => {
  const token = getUserToken();
  if (!token) throw new Error('認証が必要です。');
  const data = await request<DeleteMyAccountResponse>(DELETE_MY_ACCOUNT_MUTATION, undefined, token);
  return data.deleteMyAccount;
};
