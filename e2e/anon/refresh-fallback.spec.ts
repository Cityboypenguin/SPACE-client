import { test, expect } from '@playwright/test';

test('Web Locksなしでも別タブのrefresh結果を使う', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true });
    localStorage.setItem('space_user_token', 'old-access');
    localStorage.setItem('space_user_refresh_token', 'old-refresh');
  });
  await context.route('**/refresh-test', (route) => route.fulfill({
    contentType: 'text/html', body: '<!doctype html><title>Refresh test</title>',
  }));

  let refreshCalls = 0;
  await context.route('**/query', async (route) => {
    const query = route.request().postDataJSON()?.query as string | undefined;
    if (query?.includes('RefreshUserToken')) {
      refreshCalls++;
      if (refreshCalls === 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        await route.fulfill({ json: { data: { refreshUserToken: {
          token: 'new-access', refreshToken: 'new-refresh',
        } } } });
      } else {
        await route.fulfill({ json: { errors: [{ message: 'refresh token has been revoked' }] } });
      }
      return;
    }
    if (route.request().headers().authorization === 'Bearer new-access') {
      await route.fulfill({ json: { data: { test: 'ok' } } });
    } else {
      await route.fulfill({ status: 401, json: { errors: [{ message: 'invalid token' }] } });
    }
  });

  const url = new URL('/refresh-test', baseURL).href;
  const first = await context.newPage();
  const second = await context.newPage();
  await Promise.all([first.goto(url), second.goto(url)]);
  const run = (page: typeof first) => page.evaluate(async () => {
    const modulePath = '/src/lib/graphql.ts';
    const { request } = await import(modulePath);
    return request('{ test }', undefined, 'old-access');
  });
  const [firstResult, secondResult] = await Promise.all([run(first), run(second)]);
  expect(firstResult).toEqual({ test: 'ok' });
  expect(secondResult).toEqual({ test: 'ok' });
  expect(refreshCalls).toBe(2);
  await context.close();
});
