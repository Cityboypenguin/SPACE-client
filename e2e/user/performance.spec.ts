/**
 * ユーザー向けページの性能テスト
 * user project（ログイン済み）で実行される。
 */
import { test, expect } from '@playwright/test';
import { injectLCPObserver, collectMetrics, PERF_THRESHOLDS } from '../support/perfUtils';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

const routes: Array<{ path: string; waitFor: string }> = [
  { path: '/home', waitFor: '新規投稿' },
  { path: '/notifications', waitFor: '通知' },
  { path: '/community', waitFor: 'コミュニティ' },
];

for (const { path, waitFor } of routes) {
  test(`${path} が ${PERF_THRESHOLDS.total}ms 以内にロードされる`, async ({ page }) => {
    await injectLCPObserver(page);
    await page.goto(path, { waitUntil: 'networkidle' });
    await dismissTermsConsentModalIfPresent(page);
    await expect(page.getByText(waitFor).first()).toBeVisible({ timeout: PERF_THRESHOLDS.total });

    const metrics = await collectMetrics(page, path);

    expect(metrics.total, `${path} total load time`).toBeLessThan(PERF_THRESHOLDS.total);
    if (metrics.fcp != null) {
      expect(metrics.fcp, `${path} FCP`).toBeLessThan(PERF_THRESHOLDS.fcp);
    }
    if (metrics.lcp != null) {
      expect(metrics.lcp, `${path} LCP`).toBeLessThan(PERF_THRESHOLDS.lcp);
    }
  });
}

test('SPA内ページ遷移が各 2000ms 以内に完了する', async ({ page }) => {
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissTermsConsentModalIfPresent(page);
  await expect(page.getByText('新規投稿')).toBeVisible();

  const paths = ['/notifications', '/community', '/home'];
  for (const to of paths) {
    const start = Date.now();
    await page.goto(to, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const ms = Date.now() - start;
    console.log(`[perf] SPA ${to}: ${ms}ms`);
    expect(ms, `SPA transition to ${to}`).toBeLessThan(PERF_THRESHOLDS.spaTransition);
  }
});

test('投稿詳細ページが 5000ms 以内にロードされる', async ({ page }) => {
  // ホームから最初の投稿をクリックして遷移
  await injectLCPObserver(page);
  await page.goto('/home', { waitUntil: 'networkidle' });
  await dismissTermsConsentModalIfPresent(page);

  // 最初の投稿本文をクリック（存在する場合のみ計測）
  const firstPost = page.locator('article, [data-testid="post"], .post').first();
  const postExists = await firstPost.isVisible().catch(() => false);
  if (!postExists) {
    test.skip(true, 'ホームに投稿が存在しないためスキップ');
    return;
  }

  await firstPost.click();
  await page.waitForURL(/\/posts\/.+/);
  await page.waitForLoadState('networkidle');

  const metrics = await collectMetrics(page, '/posts/:id');
  expect(metrics.total, '投稿詳細 total load time').toBeLessThan(PERF_THRESHOLDS.total);
});
