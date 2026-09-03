import type { Page } from '@playwright/test';

// 新しい利用規約バージョンが公開され未同意の場合、保護ページ全体に同意モーダルが
// 被るため、スモークテストの前にあれば消しておく。スクロール検知で「同意する」が
// 有効化される作りなので、本文コンテナを底までスクロールしてからクリックする。
export const dismissTermsConsentModalIfPresent = async (page: Page) => {
  const heading = page.getByText('利用規約への同意');
  if (!(await heading.isVisible({ timeout: 1000 }).catch(() => false))) return;

  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('div').forEach((el) => {
      if (getComputedStyle(el).overflowY === 'auto' && el.scrollHeight > el.clientHeight) {
        el.scrollTop = el.scrollHeight;
        el.dispatchEvent(new Event('scroll'));
      }
    });
  });

  const consentButton = page.getByRole('button', { name: '上記の利用規約に同意する' });
  if (await consentButton.isEnabled().catch(() => false)) {
    await consentButton.click();
    await heading.waitFor({ state: 'hidden' });
  }
};
