import type { APIRequestContext, Browser, Page } from '@playwright/test';
import {
  USER_TOKEN_KEY,
  USER_REFRESH_TOKEN_KEY,
  USER_ID_KEY,
} from '../../src/lib/authStorage';
import { loginUserViaApi } from './api';
import { env } from './env';

// 自分の投稿には「いいね」できない仕様のため、いいねの正常系（件数が増える）を
// 検証するには投稿者本人とは別のユーザーでログインする必要がある。
// setup projectのstorageStateとは別に、ここでだけ使う2人目のユーザーのページを作る。
export const loginAsSecondUser = async (
  browser: Browser,
  request: APIRequestContext,
  baseURL: string,
): Promise<Page> => {
  const { token, refreshToken, user } = await loginUserViaApi(
    request,
    baseURL,
    env.user2.email,
    env.user2.password,
  );

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/login');
  await page.evaluate(
    ([tokenKey, refreshKey, idKey, t, r, id]) => {
      localStorage.setItem(tokenKey, t);
      localStorage.setItem(refreshKey, r);
      localStorage.setItem(idKey, id);
    },
    [USER_TOKEN_KEY, USER_REFRESH_TOKEN_KEY, USER_ID_KEY, token, refreshToken, user.ID],
  );
  return page;
};
