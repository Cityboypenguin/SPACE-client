import { request } from '../../../lib/graphql';

type Administrator = {
  ID: string;
  name: string;
  email: string;
};

type LoginAdminResponse = {
  loginAdministrator: {
    token: string;
    administrator: Administrator;
  };
};

type LogoutAdminResponse = {
  logoutAdministrator: boolean;
};

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
  return await request<LoginAdminResponse>(LOGIN_ADMIN_MUTATION, variables);
};

export const logoutAdmin = async (token: string) => {
  return await request<LogoutAdminResponse>(LOGOUT_ADMIN_MUTATION, { token });
};