/**
 * 管理画面の性能テスト
 * admin project（管理者ログイン済み）で実行される。
 */
import { test, expect } from '@playwright/test';
import { injectLCPObserver, collectMetrics, PERF_THRESHOLDS } from '../support/perfUtils';

const routes: Array<{ path: string; heading: string }> = [
  { path: '/admin/users', heading: 'ユーザー一覧' },
  { path: '/admin/analytics', heading: 'アナリティクス' },
  { path: '/admin/posts', heading: '投稿一覧' },
  { path: '/admin/communities', heading: 'コミュニティ一覧' },
  { path: '/admin/reports', heading: '通報一覧' },
];

for (const { path, heading } of routes) {
  test(`${path} が ${PERF_THRESHOLDS.total}ms 以内にロードされる`, async ({ page }) => {
    await injectLCPObserver(page);
    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: PERF_THRESHOLDS.total });

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

test('アナリティクスの時系列グラフが 10000ms 以内にレンダリングされる', async ({ page }) => {
  const start = Date.now();
  await page.goto('/admin/analytics', { waitUntil: 'networkidle' });
  await expect(page.locator('main').getByText('読み込み中...')).not.toBeVisible({ timeout: 15000 });
  await expect(page.getByText('読み込み中…')).not.toBeVisible({ timeout: 15000 });
  await expect(page.getByText('アクティビティ推移')).toBeVisible();
  const ms = Date.now() - start;
  console.log(`[perf] analytics chart render: ${ms}ms`);
  expect(ms, 'analytics chart render time').toBeLessThan(10000);
});
