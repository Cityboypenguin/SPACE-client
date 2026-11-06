import { test, expect } from '@playwright/test';

test('管理者は回答だけを削除でき、失敗・キャンセル時は残る', async ({ page }) => {
  let deletes = 0;
  let fail = true;
  await page.route('**/query', async route => {
    const { query, variables } = route.request().postDataJSON();
    if (query.includes('mutation AdminDeleteAnswer(')) {
      deletes++;
      expect(variables.id).toBe('a1');
      await route.fulfill({ json: fail
        ? { errors: [{ message: '削除失敗' }] }
        : { data: { adminDeleteAnswer: true } } });
      return;
    }
    const now = '2026-11-04T00:00:00Z';
    await route.fulfill({ json: { data: { question: {
      ID: 'q1', bestAnswer: { ID: 'a1' }, answers: { total: 2, items: ['a1', 'a2'].map(ID => ({
        ID, body: `回答本文 ${ID}`, user: { ID: 'u1', name: '回答者', accountID: 'author' },
        media: [], addenda: [], likeCount: 0, createdAt: now, updatedAt: now,
      })) },
    } } } });
  });
  await page.route('**/admin-answer-test', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><body><div id="root"></div><script type="module">
    import RefreshRuntime from '/@react-refresh';
    RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
    await import('/e2e/fixtures/admin-answer-harness.js');
  </script></body></html>` }));
  await page.goto('/admin-answer-test');
  await page.getByRole('button', { name: '回答を表示（2件）' }).click();
  const remove = page.getByRole('button', { name: '回答を削除', exact: true }).first();
  await expect(page.getByText('回答本文 a1')).toBeVisible();
  page.once('dialog', dialog => dialog.dismiss());
  await remove.click();
  expect(deletes).toBe(0);
  await expect(page.getByText('回答本文 a1')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await remove.click();
  await expect(page.getByRole('alert')).toHaveText('回答の削除に失敗しました');
  await expect(page.getByText('回答本文 a1')).toBeVisible();
  await expect(page.getByText('回答数: 2 / 解決済み')).toBeVisible();
  fail = false;
  page.once('dialog', dialog => dialog.accept());
  await remove.click();
  await expect(page.getByText('回答本文 a1')).toHaveCount(0);
  await expect(page.getByText('回答本文 a2')).toBeVisible();
  await expect(page.getByText('回答数: 1 / 未解決')).toBeVisible();
  await page.getByRole('button', { name: '回答を閉じる' }).click();
  await expect(page.getByRole('button', { name: '回答を表示（1件）' })).toBeVisible();
  expect(deletes).toBe(2);
});
