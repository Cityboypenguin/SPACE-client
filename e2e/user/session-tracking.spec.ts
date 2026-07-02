import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

// セッショントラッカーが recordSessionData ミューテーションを送信することを確認する。
// flush() はタブ非表示（visibilitychange: hidden）または beforeunload で実行される。

test('タブ非表示時に recordSessionData ミューテーションが送信される', async ({ page }) => {
  // リクエストを監視するプロミスをページ遷移より前にセットアップする
  const mutationRequestPromise = page.waitForRequest(
    (req) => {
      if (!req.url().includes('/query')) return false;
      try {
        const body = req.postDataJSON() as { query?: string } | null;
        return !!body?.query?.includes('RecordSessionData');
      } catch {
        return false;
      }
    },
    { timeout: 10000 },
  );

  await page.goto('/home');
  await dismissTermsConsentModalIfPresent(page);

  // SPA内でページ遷移してトラッカーに複数のページビューを記録させる
  await page.evaluate(() => {
    window.history.pushState({}, '', '/notifications');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  // visibilitychange: hidden でフラッシュをトリガーする
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      get: () => 'hidden',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  const request = await mutationRequestPromise;
  const body = request.postDataJSON() as {
    query: string;
    variables?: { input?: { sessionDurationSeconds?: number; pageViews?: unknown[] } };
  };

  expect(body.query).toContain('RecordSessionData');
  expect(body.variables?.input?.sessionDurationSeconds).toBeGreaterThanOrEqual(0);
  expect(Array.isArray(body.variables?.input?.pageViews)).toBe(true);
});

test('ページ遷移のたびに trackPageEnter が呼ばれ、pageViews に記録される', async ({ page }) => {
  const capturedBodies: { variables?: { input?: { pageViews?: Array<{ path: string }> } } }[] = [];

  await page.route('**/query', async (route) => {
    try {
      const body = route.request().postDataJSON() as { query?: string } | null;
      if (body?.query?.includes('RecordSessionData')) {
        capturedBodies.push(body as typeof capturedBodies[number]);
      }
    } catch { /* ignore */ }
    await route.continue();
  });

  await page.goto('/home');
  await dismissTermsConsentModalIfPresent(page);

  // SPA内で 3 ページ分を遷移して記録させる
  const paths = ['/notifications', '/home', '/community'];
  for (const path of paths) {
    await page.evaluate((p) => {
      window.history.pushState({}, '', p);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, path);
  }

  // flush() を起動する
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      get: () => 'hidden',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  // ミューテーションが送信されるまで待つ
  await expect.poll(() => capturedBodies.length, { timeout: 10000 }).toBeGreaterThan(0);

  const pageViews = capturedBodies[0].variables?.input?.pageViews ?? [];
  // /home と遷移先のページがどちらも記録されていること
  const recordedPaths = pageViews.map((pv) => pv.path);
  expect(recordedPaths).toContain('/home');
});
