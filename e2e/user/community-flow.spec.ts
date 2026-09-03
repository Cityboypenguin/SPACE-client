import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

const operationNameFromQuery = (query: unknown): string | null => {
  if (typeof query !== 'string') return null;
  const match = query.match(/\b(?:query|mutation|subscription)\s+([A-Za-z0-9_]+)/);
  return match?.[1] ?? null;
};

test('コミュニティを作成すると一覧に表示され、チャットルームを開ける', async ({ page }) => {
  const communityName = `E2Eコミュニティ ${Date.now()}`;
  const operationsAfterOpeningDetail: string[] = [];
  let watchingDetailRequests = false;

  page.on('request', (request) => {
    if (!watchingDetailRequests || request.method() !== 'POST') return;
    const url = new URL(request.url());
    if (url.pathname !== '/query') return;
    const body = request.postDataJSON() as { query?: unknown } | null;
    const operationName = operationNameFromQuery(body?.query);
    if (operationName) operationsAfterOpeningDetail.push(operationName);
  });

  await page.goto('/community/create');
  await dismissTermsConsentModalIfPresent(page);

  await page.locator('input[type="text"]').fill(communityName);
  await page.locator('textarea').fill('E2Eテストで作成したコミュニティです。');
  await page.getByRole('button', { name: '作成する' }).click();

  await expect(page).toHaveURL(/\/community$/);
  await expect(page.getByText(communityName)).toBeVisible();

  await page.getByText(communityName).click();
  await expect(page).toHaveURL(/\/community\/chat\/.+/);
  await expect(page.getByText(communityName).first()).toBeVisible();
  await expect(page.getByPlaceholder(/メッセージを入力/)).toBeVisible();

  watchingDetailRequests = true;
  await page.locator('button').filter({ has: page.locator('strong', { hasText: communityName }) }).click();
  await expect(page.getByText('メンバー一覧').first()).toBeVisible();
  await page.waitForTimeout(500);

  expect(operationsAfterOpeningDetail).not.toContain('GetProfileByUserID');
  expect(operationsAfterOpeningDetail).not.toContain('MyCommunities');
});
