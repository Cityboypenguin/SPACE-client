import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
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

const SendEmailOTPDocument = graphql(`
  mutation SendEmailOTP($email: String!) {
    sendEmailOTP(email: $email)
  }
`);

const VerifyEmailOTPDocument = graphql(`
  mutation VerifyEmailOTP($email: String!, $otp: String!) {
    verifyEmailOTP(email: $email, otp: $otp)
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
  return await requestDoc(LoginUserDocument, { input: { email, password } });
};

export const logoutUser = async (token: string) => {
  return await requestDoc(LogoutUserDocument, { token });
};

export const sendEmailOTP = async (email: string) => {
  return await requestDoc(SendEmailOTPDocument, { email });
};

export const verifyEmailOTP = async (email: string, otp: string) => {
  return await requestDoc(VerifyEmailOTPDocument, { email, otp });
};

export const registerUser = async (accountID: string, name: string, email: string, password: string, otp: string) => {
  return await requestDoc(CreateUserDocument, { input: { accountID, name, email, password, otp } });
};

const RequestPasswordResetDocument = graphql(`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`);

const VerifyPasswordResetOTPDocument = graphql(`
  mutation VerifyPasswordResetOTP($email: String!, $otp: String!) {
    verifyPasswordResetOTP(email: $email, otp: $otp)
  }
`);

const ResetPasswordDocument = graphql(`
  mutation ResetPassword($resetToken: String!, $newPassword: String!) {
    resetPassword(resetToken: $resetToken, newPassword: $newPassword)
  }
`);

export const requestPasswordReset = async (email: string) => {
  return await requestDoc(RequestPasswordResetDocument, { email });
};

export const verifyPasswordResetOTP = async (email: string, otp: string) => {
  return await requestDoc(VerifyPasswordResetOTPDocument, { email, otp });
};

export const resetPassword = async (resetToken: string, newPassword: string) => {
  return await requestDoc(ResetPasswordDocument, { resetToken, newPassword });
};
