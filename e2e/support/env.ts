const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `環境変数 ${name} が設定されていません。e2e/.env.test.example を参考に e2e/.env.test.local を作成してください。`,
    );
  }
  return value;
};

export const env = {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
  user: {
    get email() { return required('E2E_USER_EMAIL'); },
    get password() { return required('E2E_USER_PASSWORD'); },
  },
  // post-flow specの「他人の投稿にいいねする」ケースのみで使う2人目のユーザー
  user2: {
    get email() { return required('E2E_USER2_EMAIL'); },
    get password() { return required('E2E_USER2_PASSWORD'); },
  },
  admin: {
    get email() { return required('E2E_ADMIN_EMAIL'); },
    get password() { return required('E2E_ADMIN_PASSWORD'); },
  },
};
