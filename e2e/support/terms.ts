import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * DM/コミュニティルームのメッセージ取得が率制限等でサーバーエラーになった場合、
 * リトライリロードで回復する。最大3回まで試みる。
 */
export const waitForRoomReady = async (page: Page) => {
  for (let retry = 0; retry < 3; retry++) {
    const errMsg = page.getByText('サーバーとの通信でエラーが発生しました');
    if (!(await errMsg.isVisible().catch(() => false))) return;
    await page.waitForTimeout(1000 * (retry + 1));
    await page.reload({ waitUntil: 'load' });
  }
};

// 新しい利用規約バージョンが公開され未同意の場合、保護ページ全体に同意モーダルが
// 被るため、スモークテストの前にあれば消しておく。スクロール検知で「同意する」が
// 有効化される作りなので、本文コンテナを底までスクロールしてからクリックする。
export const dismissTermsConsentModalIfPresent = async (page: Page) => {
  const heading = page.getByText('利用規約への同意');
  if (!(await heading.isVisible({ timeout: 1000 }).catch(() => false))) return;

  // TermsContent が fetch で規約文書を非同期取得する。ロード前は scrollHeight ≈ clientHeight なのでまず待つ。
  await page.getByText('読み込み中...').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

  // dispatchEvent('scroll') は React 17 の onScroll をトリガーしないため、
  // 実際のマウスホイール操作でスクロールする（ブラウザのネイティブスクロール → React onScroll 発火）
  const h2 = page.getByRole('heading', { name: '利用規約への同意' });
  const box = await h2.boundingBox().catch(() => null);
  if (box) {
    // h2 の下 150px 付近 = TermsContent の本文エリア
    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 150);
    await page.mouse.wheel(0, 99999);
  }

  const consentButton = page.getByRole('button', { name: '上記の利用規約に同意する' });
  await expect(consentButton).toBeEnabled({ timeout: 5000 }).catch(() => {});
  if (await consentButton.isEnabled().catch(() => false)) {
    await consentButton.click();
    await heading.waitFor({ state: 'hidden' });
  }
};
