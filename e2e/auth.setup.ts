import { test as setup } from '@playwright/test';
import {
  USER_TOKEN_KEY,
  USER_REFRESH_TOKEN_KEY,
  USER_ID_KEY,
  ADMIN_TOKEN_KEY,
  ADMIN_REFRESH_TOKEN_KEY,
} from '../src/lib/authStorage';
import { loginUserViaApi, loginAdminViaApi } from './support/api';
import { env } from './support/env';

const USER_STORAGE_STATE = 'e2e/.auth/user.json';
const ADMIN_STORAGE_STATE = 'e2e/.auth/admin.json';

setup('authenticate as user', async ({ page, request, baseURL }) => {
  const base = baseURL ?? env.baseURL;
  const { token, refreshToken, user } = await loginUserViaApi(request, base, env.user.email, env.user.password);

  await page.goto('/login');
  await page.evaluate(
    ([tokenKey, refreshKey, idKey, t, r, id]) => {
      localStorage.setItem(tokenKey, t);
      localStorage.setItem(refreshKey, r);
      localStorage.setItem(idKey, id);
    },
    [USER_TOKEN_KEY, USER_REFRESH_TOKEN_KEY, USER_ID_KEY, token, refreshToken, user.ID],
  );

  await page.context().storageState({ path: USER_STORAGE_STATE });
});

setup('authenticate as admin', async ({ page, request, baseURL }) => {
  const base = baseURL ?? env.baseURL;
  const { token, refreshToken } = await loginAdminViaApi(request, base, env.admin.email, env.admin.password);

  await page.goto('/admin/login');
  await page.evaluate(
    ([tokenKey, refreshKey, t, r]) => {
      localStorage.setItem(tokenKey, t);
      localStorage.setItem(refreshKey, r);
    },
    [ADMIN_TOKEN_KEY, ADMIN_REFRESH_TOKEN_KEY, token, refreshToken],
  );

  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
