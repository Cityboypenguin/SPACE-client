import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';

export type User = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

export type Blocker = {
  ID: string;
  userID: string;
  blockedUserID: string;
  createdAt: string;
};

const GetBlockersByUserIDDocument = graphql(`
  query GetBlockersByUserID($userID: ID!) {
    GetBlockersByUserID(userID: $userID) {
      ID
      name
      accountID
      avatarUrl
    }
  }
`);

const CreateBlockerDocument = graphql(`
  mutation CreateBlocker($blockedUserID: ID!) {
    createBlocker(blockedUserID: $blockedUserID) {
      ID
      userID
      blockedUserID
      createdAt
    }
  }
`);

const DeleteBlockerDocument = graphql(`
  mutation DeleteBlocker($blockedUserID: ID!) {
    deleteBlocker(blockedUserID: $blockedUserID)
  }
`);

const ListBlockedUsersDocument = graphql(`
  query ListBlockedUsers($limit: Int, $offset: Int) {
    listBlockedUsers(limit: $limit, offset: $offset) {
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

export const getBlockersByUserID = async (userID: string): Promise<User[]> => {
  const data = await requestDoc(GetBlockersByUserIDDocument, { userID }, getUserToken());
  return data.GetBlockersByUserID;
};

export const createBlocker = async (blockedUserID: string): Promise<Blocker> => {
  const data = await requestDoc(CreateBlockerDocument, { blockedUserID }, getUserToken());
  return data.createBlocker;
};

export const deleteBlocker = async (blockedUserID: string): Promise<void> => {
  await requestDoc(DeleteBlockerDocument, { blockedUserID }, getUserToken());
};

export type UserPage = { items: User[]; total: number };

export const listBlockedUsers = async (limit = 20, offset = 0): Promise<UserPage> => {
  const data = await requestDoc(ListBlockedUsersDocument, { limit, offset }, getUserToken());
  return data.listBlockedUsers;
};