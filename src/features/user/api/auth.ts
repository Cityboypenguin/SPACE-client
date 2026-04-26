import { request } from '../../../lib/graphql';

export const USER_TOKEN_KEY = 'space_user_token';
export const USER_REFRESH_TOKEN_KEY = 'space_user_refresh_token';
export const USER_ID_KEY = 'space_user_id';

export type User = {
  ID: string;
  accountID: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type LoginUserResponse = {
  loginUser: {
    token: string;
    refreshToken: string;
    user: User;
  };
};

type LogoutUserResponse = {
  logoutUser: boolean;
};

type RegisterUserResponse = {
  createUser: User;
};

const LOGIN_USER_MUTATION = `
  mutation LoginUser($input: LoginInput!) {
    loginUser(input: $input) {
      token
      refreshToken
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

const LOGOUT_USER_MUTATION = `
  mutation LogoutUser($token: String!) {
    logoutUser(token: $token)
  }
`;

const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      ID
      accountID
      name
      email
      role
      status
    }
  }
`;

export const loginUser = async (email: string, password: string) => {
  return await request<LoginUserResponse>(LOGIN_USER_MUTATION, { input: { email, password } });
};

export const logoutUser = async (token: string) => {
  return await request<LogoutUserResponse>(LOGOUT_USER_MUTATION, { token });
};

export const registerUser = async (accountID: string, name: string, email: string, password: string) => {
  return await request<RegisterUserResponse>(CREATE_USER_MUTATION, { input: { accountID, name, email, password } });
};
