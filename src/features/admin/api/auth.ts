import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { ADMIN_REFRESH_TOKEN_KEY, ADMIN_TOKEN_KEY } from '../../../lib/authStorage';

export { ADMIN_REFRESH_TOKEN_KEY, ADMIN_TOKEN_KEY };

const LoginAdminDocument = graphql(`
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
`);

const LogoutAdminDocument = graphql(`
  mutation LogoutAdmin($token: String!) {
    logoutAdministrator(token: $token)
  }
`);

export const loginAdmin = async (email: string, password: string) => {
  return await requestDoc(LoginAdminDocument, { input: { email, password } });
};

export const logoutAdmin = async (token: string) => {
  return await requestDoc(LogoutAdminDocument, { token });
};
