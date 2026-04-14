import { request } from '../../../lib/graphql';

export const USER_TOKEN_KEY = 'space_user_token';

type User = {
  ID: string;
  userID: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type LoginUserResponse = {
  loginUser: {
    token: string;
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
      user {
        ID
        userID
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
      userID
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

export const registerUser = async (userID: string, name: string, email: string, password: string) => {
  return await request<RegisterUserResponse>(CREATE_USER_MUTATION, { input: { userID, name, email, password } });
};
