import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import type {
  CreateUserMutation,
  LoginUserMutation,
  RequestPasswordResetMutation,
  ResetPasswordMutation,
} from '../../../generated/graphql';
import { USER_ID_KEY, USER_REFRESH_TOKEN_KEY, USER_TOKEN_KEY } from '../../../lib/authStorage';

export { USER_ID_KEY, USER_REFRESH_TOKEN_KEY, USER_TOKEN_KEY };

export const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY) ?? undefined;

const LoginUserDocument = graphql(`
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
`);

const LogoutUserDocument = graphql(`
  mutation LogoutUser($token: String!) {
    logoutUser(token: $token)
  }
`);

const CreateUserDocument = graphql(`
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
`);

export const loginUser = async (email: string, password: string) => {
  return await requestDoc<LoginUserMutation, { input: { email: string; password: string } }>(LoginUserDocument, { input: { email, password } });
};

export const logoutUser = async (token: string) => {
  return await requestDoc(LogoutUserDocument, { token });
};

export const registerUser = async (accountID: string, name: string, email: string, password: string) => {
  return await requestDoc<CreateUserMutation, { input: { accountID: string; name: string; email: string; password: string } }>(CreateUserDocument, {
    input: { accountID, name, email, password },
  });
};

const RequestPasswordResetDocument = graphql(`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`);

const ResetPasswordDocument = graphql(`
  mutation ResetPassword($resetToken: String!, $newPassword: String!) {
    resetPassword(resetToken: $resetToken, newPassword: $newPassword)
  }
`);

export const requestPasswordReset = async (email: string) => {
  return await requestDoc<RequestPasswordResetMutation, { email: string }>(RequestPasswordResetDocument, { email });
};

export const resetPassword = async (resetToken: string, newPassword: string) => {
  return await requestDoc<ResetPasswordMutation, { resetToken: string; newPassword: string }>(ResetPasswordDocument, { resetToken, newPassword });
};
