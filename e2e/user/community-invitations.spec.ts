import { expect, test } from '@playwright/test';
import { loginAsSecondUser } from '../support/secondUser';
import { env } from '../support/env';
import { dismissTermsConsentModalIfPresent } from '../support/terms';

test('検索で招待した相手が受信一覧から参加し、歓迎投稿が1回だけ表示される', async ({
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

    await recipient.goto(new URL('/community', baseURL ?? env.baseURL).href);
    await recipient.getByRole('button', { name: /^届いた招待/ }).click();
    await recipient.locator('main').getByRole('link', { name: new RegExp(name) }).click();
    await recipient.getByRole('button', { name: '参加する', exact: true }).click();
    await expect(recipient).toHaveURL(/\/community\/chat\//);
    const welcome = recipient.getByText(/さんが参加しました$/);
    await expect(welcome).toHaveCount(1);

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
