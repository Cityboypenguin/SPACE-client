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
  mutation LogoutAdmin($token: String!, $refreshToken: String) {
    logoutAdministrator(token: $token, refreshToken: $refreshToken)
  }
`);

export const loginAdmin = async (email: string, password: string) => {
  return await requestDoc(LoginAdminDocument, { input: { email, password } });
};

// リフレッシュトークンも渡して止めてもらう（渡さないと、ログアウト後も更新に使えてしまう）。
export const logoutAdmin = async (token: string) => {
  const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
  return await requestDoc(LogoutAdminDocument, { token, refreshToken });
};
