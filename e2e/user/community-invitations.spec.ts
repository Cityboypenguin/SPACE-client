import { expect, test } from '@playwright/test';
import { loginAsSecondUser } from '../support/secondUser';
import { env } from '../support/env';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

test('検索で招待した相手が通知詳細から参加し、参加案内が1回だけ表示される', async ({
  page, browser, request, baseURL,
}) => {
  const name = `招待E2E ${Date.now()}`;
  const recipient = await loginAsSecondUser(browser, request, baseURL ?? env.baseURL);
  try {
    await page.goto('/community/create');
    await dismissTermsConsentModalIfPresent(page);
    await page.locator('input[type="text"]').fill(name);
    await page.locator('textarea').fill('招待を検証するコミュニティ');
    await page.getByRole('button', { name: '作成する' }).click();
    await expect(page).toHaveURL(/\/community$/);
    await page.getByText(name, { exact: true }).click();

    await page.getByRole('button').filter({ has: page.getByText(name, { exact: true }) }).click();
    await page.getByRole('button', { name: '招待する', exact: true }).click();
    const recipientAccountID = await recipient.evaluate(async () => {
      const token = localStorage.getItem('space_user_token');
      const response = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: 'query { me { accountID } }' }),
      });
      const result = await response.json();
      return result.data.me.accountID as string;
    });
    await page.getByRole('searchbox', { name: '名前またはアカウントID' }).fill(recipientAccountID);
    await page.getByRole('button', { name: '検索', exact: true }).click();
    await page.getByRole('button', { name: '招待する', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('さんに招待を送りました。');

    await recipient.goto(new URL('/notifications', baseURL ?? env.baseURL).href);
    await recipient.locator('main').getByText(`${name}に招待されました`, { exact: true }).click();
    await expect(recipient).toHaveURL(/\/notifications\/[^/]+$/);
    await expect(recipient.getByRole('button', { name: '削除', exact: true })).toBeVisible();
    await expect(recipient.getByRole('button', { name: '参加する', exact: true })).toBeVisible();
    const back = recipient.locator('main').getByRole('button').first();
    await expect(back).toHaveText('');
    await back.click();
    await expect(recipient).toHaveURL(/\/notifications$/);

    await recipient.setViewportSize({ width: 375, height: 812 });
    await recipient.goto(new URL('/community', baseURL ?? env.baseURL).href);
    const inviteButton = recipient.getByRole('button', { name: /^届いた招待 [1-9]/ });
    await expect(inviteButton).toBeVisible();
    const [label, badge] = await Promise.all([
      inviteButton.locator('span').first().boundingBox(),
      inviteButton.locator('span').last().boundingBox(),
    ]);
    expect(label && badge && badge.x >= label.x + label.width).toBe(true);
    await inviteButton.click();
    await recipient.locator('main').getByRole('link', { name: new RegExp(name) }).click();
    await expect(recipient.getByRole('link', { name: '届いた招待に戻る', exact: true })).toBeVisible();

    await recipient.goto(new URL('/notifications', baseURL ?? env.baseURL).href);
    await recipient.locator('main').getByText(`${name}に招待されました`, { exact: true }).click();
    await recipient.getByRole('button', { name: '参加する', exact: true }).click();
    await expect(recipient).toHaveURL(/\/community\/chat\//);
    const welcome = recipient.getByText(/さんが参加しました$/);
    await expect(welcome).toHaveCount(1);
    await expect(welcome).toHaveCSS('text-align', 'center');
    await expect(recipient.getByText('システム', { exact: true })).toHaveCount(0);

    await recipient.reload();
    await expect(welcome).toHaveCount(1);
    const loaded = recipient.waitForResponse(response =>
      new URL(response.url()).pathname === '/query' &&
      (response.request().postData()?.includes('query ReceivedCommunityInvitations') ?? false),
    );
    await recipient.goto(new URL('/community/invitations', baseURL ?? env.baseURL).href);
    await loaded;
    await expect(recipient.getByRole('heading', { name: '届いた招待' })).toBeVisible();
    await expect(recipient.getByRole('link', { name: new RegExp(name) })).toHaveCount(0);
  } finally {
    await recipient.context().close();
  }
});
