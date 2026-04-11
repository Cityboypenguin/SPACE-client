import { request } from '../../../lib/graphql';

// ログイン用の入力型（スキーマの LoginInput に対応）
// email と password が必要
const LOGIN_ADMIN_MUTATION = `
  mutation LoginAdmin($input: LoginInput!) {
    loginAdministrator(input: $input) {
      token
      administrator {
        ID
        name
        email
      }
    }
  }
`;

// ログアウト用の Mutation
const LOGOUT_ADMIN_MUTATION = `
  mutation LogoutAdmin($token: String!) {
    logoutAdministrator(token: $token)
  }
`;

export const loginAdmin = async (email: string, password: string) => {
  const variables = { input: { email, password } };
  return await request<any>(LOGIN_ADMIN_MUTATION, variables);
};

export const logoutAdmin = async (token: string) => {
  return await request<any>(LOGOUT_ADMIN_MUTATION, { token });
};