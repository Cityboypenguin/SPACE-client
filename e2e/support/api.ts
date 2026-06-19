import type { APIRequestContext } from '@playwright/test';

const graphqlUrl = (baseURL: string) => new URL('/query', baseURL).toString();

const post = async <T>(
  request: APIRequestContext,
  baseURL: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> => {
  const response = await request.post(graphqlUrl(baseURL), {
    data: { query, variables },
  });
  if (!response.ok()) {
    throw new Error(`GraphQL request failed: ${response.status()} ${await response.text()}`);
  }
  const json = await response.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${json.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }
  return json.data as T;
};

const LOGIN_USER_MUTATION = `
  mutation LoginUser($input: LoginInput!) {
    loginUser(input: $input) {
      token
      refreshToken
      user { ID }
    }
  }
`;

export const loginUserViaApi = async (request: APIRequestContext, baseURL: string, email: string, password: string) => {
  const data = await post<{ loginUser: { token: string; refreshToken: string; user: { ID: string } } }>(
    request,
    baseURL,
    LOGIN_USER_MUTATION,
    { input: { email, password } },
  );
  return data.loginUser;
};

const LOGIN_ADMIN_MUTATION = `
  mutation LoginAdmin($input: LoginInput!) {
    loginAdministrator(input: $input) {
      token
      refreshToken
    }
  }
`;

export const loginAdminViaApi = async (request: APIRequestContext, baseURL: string, email: string, password: string) => {
  const data = await post<{ loginAdministrator: { token: string; refreshToken: string } }>(
    request,
    baseURL,
    LOGIN_ADMIN_MUTATION,
    { input: { email, password } },
  );
  return data.loginAdministrator;
};
