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
  for (let attempt = 0; ; attempt++) {
    const response = await request.post(graphqlUrl(baseURL), {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { query, variables },
    });
    if (response.status() === 429 && attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
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
  }
};

const userPost = async <T>(
  request: APIRequestContext,
  baseURL: string,
  userToken: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    const response = await request.post(graphqlUrl(baseURL), {
      headers: { Authorization: `Bearer ${userToken}` },
      data: { query, variables },
    });
    if (response.status() === 429 && attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    const json = await response.json();
    if (json.errors) {
      throw new Error(`GraphQL errors: ${json.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }
    return json.data as T;
  }
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
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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

const CREATE_COMMUNITY_MUTATION = `
  mutation CreateCommunity($input: CreateCommunityInput!) {
    createCommunity(input: $input) {
      ID
      roomID
    }
  }
`;

const JOIN_ROOM_MUTATION = `
  mutation JoinRoom($roomID: ID!) {
    joinRoom(roomID: $roomID)
  }
`;

const LEAVE_ROOM_MUTATION = `
  mutation RemoveUserFromRoom($input: RemoveUserFromRoomInput!) {
    removeUserFromRoom(input: $input)
  }
`;

const SEND_MESSAGE_MUTATION = `
  mutation SendMessage($roomID: ID!, $content: String!) {
    sendMessage(roomID: $roomID, content: $content) {
      ID
    }
  }
`;

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ID
    }
  }
`;

const CURRENT_TERMS_QUERY = `
  query CurrentTerms {
    currentTerms { ID }
  }
`;

const CONSENT_TO_TERMS_MUTATION = `
  mutation ConsentToTerms($termsID: ID!) {
    consentToTerms(termsID: $termsID)
  }
`;

export const createCommunityAsUser = async (
  request: APIRequestContext,
  baseURL: string,
  userToken: string,
  name: string,
  description: string,
): Promise<{ communityID: string; roomID: string }> => {
  const data = await userPost<{ createCommunity: { ID: string; roomID: string } }>(
    request, baseURL, userToken, CREATE_COMMUNITY_MUTATION, { input: { name, description, avatarKey: '' } },
  );
  return { communityID: data.createCommunity.ID, roomID: data.createCommunity.roomID };
};

export const joinRoomAsUser = async (
  request: APIRequestContext,
  baseURL: string,
  userToken: string,
  roomID: string,
): Promise<void> => {
  await userPost<{ joinRoom: boolean }>(request, baseURL, userToken, JOIN_ROOM_MUTATION, { roomID });
};

export const leaveRoomAsUser = async (
  request: APIRequestContext,
  baseURL: string,
  userToken: string,
  roomID: string,
  userID: string,
): Promise<void> => {
  await userPost<{ removeUserFromRoom: boolean }>(
    request, baseURL, userToken, LEAVE_ROOM_MUTATION, { input: { roomID, userID } },
  );
};

export const sendMessageAsUser = async (
  request: APIRequestContext,
  baseURL: string,
  userToken: string,
  roomID: string,
  content: string,
): Promise<string> => {
  const data = await userPost<{ sendMessage: { ID: string } }>(
    request, baseURL, userToken, SEND_MESSAGE_MUTATION, { roomID, content },
  );
  return data.sendMessage.ID;
};

/**
 * ユーザートークンで投稿を作成し、投稿IDを返す。
 * ホームページUIを使わず直接APIで投稿するため、テストの信頼性が高い。
 */
export const createPostAsUser = async (
  request: APIRequestContext,
  baseURL: string,
  userToken: string,
  content: string,
): Promise<string> => {
  const data = await userPost<{ createPost: { ID: string } }>(
    request, baseURL, userToken, CREATE_POST_MUTATION, { input: { content } },
  );
  return data.createPost.ID;
};

/**
 * ダミーユーザーのトークンで最新の利用規約に同意する。
 * テスト中に利用規約モーダルが表示されないよう beforeAll で呼ぶ。
 */
export const consentDummyUserToTerms = async (
  request: APIRequestContext,
  baseURL: string,
  userToken: string,
): Promise<void> => {
  const url = graphqlUrl(baseURL);

  // 利用規約の取得は認証不要。429 時はリトライする。
  let currentTerms: { ID: string } | null = null;
  for (let attempt = 0; ; attempt++) {
    const res = await request.post(url, { data: { query: CURRENT_TERMS_QUERY, variables: {} } });
    if (res.status() === 429 && attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    const json = await res.json();
    currentTerms = json.data?.currentTerms as { ID: string } | null;
    break;
  }
  if (!currentTerms) return;

  await userPost<{ consentToTerms: boolean }>(
    request, baseURL, userToken, CONSENT_TO_TERMS_MUTATION, { termsID: currentTerms.ID },
  );
};
