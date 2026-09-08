import type { APIRequestContext, Browser, Page } from '@playwright/test';
import {
  USER_TOKEN_KEY,
  USER_REFRESH_TOKEN_KEY,
  USER_ID_KEY,
} from '../../src/lib/authStorage';
import { loginUserViaApi } from './api';
import { env } from './env';

// setup projectのstorageStateとは別に、任意の資格情報でログイン済みの新しい
// ブラウザコンテキスト/ページを作る。admin projectのspec（storageStateが管理者用）
// から一般ユーザー視点を確認したい場合や、2人目のユーザーが必要な場合に使う。
export const loginAsUser = async (
  browser: Browser,
  request: APIRequestContext,
  baseURL: string,
  email: string,
  password: string,
): Promise<Page> => {
  const { token, refreshToken, user } = await loginUserViaApi(request, baseURL, email, password);

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

// 自分の投稿には「いいね」できない仕様のため、いいねの正常系（件数が増える）を
// 検証するには投稿者本人とは別のユーザーでログインする必要がある。
// 2人目のユーザー（env.user2）専用の薄いラッパー。
export const loginAsSecondUser = (
  browser: Browser,
  request: APIRequestContext,
  baseURL: string,
): Promise<Page> => loginAsUser(browser, request, baseURL, env.user2.email, env.user2.password);
