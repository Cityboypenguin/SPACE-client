import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { ADMIN_TOKEN_KEY } from './auth';

const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;

// adminGetBlockers/adminGetFavoriteUsers はこの4フィールドしか返さないため、
// email/role/status等を含む管理者向けフル User 型は使わず専用の型を用いる。
export type RelatedUser = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

const AdminGetBlockersDocument = graphql(`
  query AdminGetBlockers($userID: ID!) {
    adminGetBlockers(userID: $userID) {
      ID
      name
      accountID
      avatarUrl
    }
  }
`);

const AdminGetFavoriteUsersDocument = graphql(`
  query AdminGetFavoriteUsers($userID: ID!) {
    adminGetFavoriteUsers(userID: $userID) {
      ID
      name
      accountID
      avatarUrl
    }
  }
`);

export const adminGetBlockers = async (userID: string): Promise<RelatedUser[]> => {
  const data = await requestDoc(AdminGetBlockersDocument, { userID }, getAdminToken());
  return data.adminGetBlockers;
};

export const adminGetFavoriteUsers = async (userID: string): Promise<RelatedUser[]> => {
  const data = await requestDoc(AdminGetFavoriteUsersDocument, { userID }, getAdminToken());
  return data.adminGetFavoriteUsers;
};
