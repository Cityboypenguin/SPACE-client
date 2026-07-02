import { request } from '../../../lib/graphql';
import { USER_ID_KEY, USER_REFRESH_TOKEN_KEY, USER_TOKEN_KEY } from '../../../lib/authStorage';

export { USER_ID_KEY, USER_REFRESH_TOKEN_KEY, USER_TOKEN_KEY };

export const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

type User = {
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

const SEND_EMAIL_OTP_MUTATION = `
  mutation SendEmailOTP($email: String!) {
    sendEmailOTP(email: $email)
  }
`;

const VERIFY_EMAIL_OTP_MUTATION = `
  mutation VerifyEmailOTP($email: String!, $otp: String!) {
    verifyEmailOTP(email: $email, otp: $otp)
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

export const sendEmailOTP = async (email: string) => {
  return await request<{ sendEmailOTP: boolean }>(SEND_EMAIL_OTP_MUTATION, { email });
};

export const verifyEmailOTP = async (email: string, otp: string) => {
  return await request<{ verifyEmailOTP: boolean }>(VERIFY_EMAIL_OTP_MUTATION, { email, otp });
};

export const registerUser = async (accountID: string, name: string, email: string, password: string, otp: string) => {
  return await request<RegisterUserResponse>(CREATE_USER_MUTATION, { input: { accountID, name, email, password, otp } });
};

const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

const VERIFY_PASSWORD_RESET_OTP_MUTATION = `
  mutation VerifyPasswordResetOTP($email: String!, $otp: String!) {
    verifyPasswordResetOTP(email: $email, otp: $otp)
  }
`;

const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($resetToken: String!, $newPassword: String!) {
    resetPassword(resetToken: $resetToken, newPassword: $newPassword)
  }
`;

export const requestPasswordReset = async (email: string) => {
  return await request<{ requestPasswordReset: boolean }>(REQUEST_PASSWORD_RESET_MUTATION, { email });
};

export const verifyPasswordResetOTP = async (email: string, otp: string) => {
  return await request<{ verifyPasswordResetOTP: string }>(VERIFY_PASSWORD_RESET_OTP_MUTATION, { email, otp });
};

export const resetPassword = async (resetToken: string, newPassword: string) => {
  return await request<{ resetPassword: boolean }>(RESET_PASSWORD_MUTATION, { resetToken, newPassword });
};
