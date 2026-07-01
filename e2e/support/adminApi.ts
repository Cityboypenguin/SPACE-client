import type { APIRequestContext } from '@playwright/test';
import { ADMIN_TOKEN_KEY } from '../../src/lib/authStorage';
import { loginAdminViaApi } from './api';
import { env } from './env';

const graphqlUrl = (baseURL: string) => new URL('/query', baseURL).toString();

const adminPost = async <T>(
  request: APIRequestContext,
  baseURL: string,
  adminToken: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> => {
  const response = await request.post(graphqlUrl(baseURL), {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { query, variables },
  });
  if (!response.ok()) {
    throw new Error(
      `Network response was not ok (${response.status()} ${response.statusText()}): ${await response.text()}`,
    );
  }
  const json = await response.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${json.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }
  return json.data as T;
};

const ADMIN_CREATE_USER_MUTATION = `
  mutation AdminCreateUser($input: AdminCreateUserInput!) {
    adminCreateUser(input: $input) {
      ID
      accountID
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

const SEARCH_USERS_QUERY = `
  query SearchUsers($keyword: String!, $limit: Int) {
    searchUsers(keyword: $keyword, limit: $limit) {
      items {
        ID
        accountID
        name
        email
      }
    }
  }
`;

export type DummyUser = {
  ID: string;
  accountID: string;
  name: string;
  email: string;
  password: string;
};

/**
 * 管理者APIでダミーユーザーを作成し、ログイン用パスワードも含めて返す。
 * テスト終了時に deleteDummyUser() で必ず削除すること。
 */
export const createDummyUser = async (
  request: APIRequestContext,
  baseURL: string,
  adminToken: string,
  overrides: Partial<{ accountID: string; name: string; email: string; password: string }> = {},
): Promise<DummyUser> => {
  const suffix = Date.now();
  const input = {
    accountID: overrides.accountID ?? `e2e_dummy_${suffix}`,
    name: overrides.name ?? `E2Eダミー${suffix}`,
    email: overrides.email ?? `e2e_dummy_${suffix}@example.com`,
    password: overrides.password ?? 'E2ePassword1!',
  };

  const data = await adminPost<{ adminCreateUser: { ID: string; accountID: string; name: string; email: string } }>(
    request,
    baseURL,
    adminToken,
    ADMIN_CREATE_USER_MUTATION,
    { input },
  );

  return { ...data.adminCreateUser, password: input.password };
};

/**
 * 管理者APIでユーザーを削除する。テストのクリーンアップで使う。
 */
export const deleteDummyUser = async (
  request: APIRequestContext,
  baseURL: string,
  adminToken: string,
  userID: string,
): Promise<void> => {
  await adminPost<{ deleteUser: boolean }>(request, baseURL, adminToken, DELETE_USER_MUTATION, { id: userID });
};

/**
 * ページのlocalStorageから管理者トークンを読み出す。
 * admin projectのstorageStateが適用されている前提。
 */
export const getAdminTokenFromPage = async (page: import('@playwright/test').Page): Promise<string> => {
  const token = await page.evaluate((key) => localStorage.getItem(key), ADMIN_TOKEN_KEY);
  if (!token) throw new Error('管理者トークンが取得できません。admin projectで実行されているか確認してください。');
  return token;
};

/**
 * APIで管理者ログインし、トークンを返す。
 * admin projectのstorageStateを使わずAPIから直接トークンを取る場合に使う。
 */
export const getAdminToken = async (request: APIRequestContext, baseURL: string): Promise<string> => {
  const { token } = await loginAdminViaApi(request, baseURL, env.admin.email, env.admin.password);
  return token;
};
