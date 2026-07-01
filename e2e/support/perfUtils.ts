/**
 * ページ性能計測ユーティリティ
 *
 * しきい値の目安（ローカル開発サーバー基準）:
 *   FCP  < 3000ms  (Core Web Vitals Good: <1800ms)
 *   LCP  < 4000ms  (Core Web Vitals Good: <2500ms)
 *   Total nav < 5000ms
 */
import type { Page } from '@playwright/test';

export const PERF_THRESHOLDS = {
  fcp: 3000,
  lcp: 4000,
  total: 5000,
  spaTransition: 2000,
};

export type PerfMetrics = {
  fcp: number | null;
  lcp: number | null;
  total: number;
};

/** goto より前に呼んで LCP を PerformanceObserver で収集しておく */
export const injectLCPObserver = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const w = window as unknown as { __lcpValue?: number };
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) w.__lcpValue = last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP API not supported in this browser
    }
  });
};

/** ページロード後にメトリクスを収集する */
export const collectMetrics = async (page: Page, label: string): Promise<PerfMetrics> => {
  const [navigationEntry] = await page.evaluate(
    () => performance.getEntriesByType('navigation') as PerformanceNavigationTiming[],
  );
  const total = navigationEntry ? navigationEntry.loadEventEnd - navigationEntry.startTime : 0;

  const paintEntries = await page.evaluate(() =>
    performance.getEntriesByType('paint').map((e) => ({ name: e.name, startTime: e.startTime })),
  );
  const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint')?.startTime ?? null;
  const lcp = await page.evaluate(() => (window as unknown as { __lcpValue?: number }).__lcpValue ?? null);

  console.log(`[perf] ${label}`, {
    fcp: fcp != null ? `${fcp.toFixed(0)}ms` : 'n/a',
    lcp: lcp != null ? `${lcp.toFixed(0)}ms` : 'n/a',
    total: `${total.toFixed(0)}ms`,
  });

  return { fcp, lcp, total };
};
