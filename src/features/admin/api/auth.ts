import { request } from '../../../lib/graphql';

export const ADMIN_TOKEN_KEY = 'space_admin_token';
export const ADMIN_REFRESH_TOKEN_KEY = 'space_admin_refresh_token';

type Administrator = {
  ID: string;
  name: string;
  email: string;
};

type LoginAdminResponse = {
  loginAdministrator: {
    token: string;
    refreshToken: string;
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
      refreshToken
      administrator {
        ID
        name
        email
      }
    }
  }
`;

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