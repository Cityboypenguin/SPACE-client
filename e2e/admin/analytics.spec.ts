import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/admin/analytics');
  // ページレベルのローディングが終わるまで待つ
  await expect(page.locator('main').getByText('読み込み中...')).not.toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'アナリティクス' })).toBeVisible();
});

test('全セクションが表示される', async ({ page }) => {
  const sections = [
    '基本集計',
    'アクティビティ・継続率',
    'セッション',
    'コンテンツ・エンゲージメント',
    'コミュニティ・ソーシャルグラフ',
    'オンボーディング',
    '通知',
    'インフラ・パフォーマンス',
  ];
  for (const title of sections) {
    await expect(page.getByText(title).first()).toBeVisible();
  }
});

test('主要な集計カードが存在する', async ({ page }) => {
  await expect(page.getByText('ユーザー数（累計）')).toBeVisible();
  await expect(page.getByText('DAU（本日）')).toBeVisible();
  await expect(page.getByText('MAU（今月）')).toBeVisible();
  await expect(page.getByText('DAU/MAU比率（スティッキネス）')).toBeVisible();
  await expect(page.getByText('平均セッション時間')).toBeVisible();
  await expect(page.getByText('オンボーディング完了率')).toBeVisible();
  await expect(page.getByText('開封率')).toBeVisible();
  await expect(page.getByText('エラーレート (5xx)')).toBeVisible();
});

test.describe('時系列グラフ', () => {
  test.beforeEach(async ({ page }) => {
    // グラフのローディングが終わるまで待つ
    await expect(page.getByText('読み込み中…')).not.toBeVisible({ timeout: 15000 });
  });

  test('コントロールが全て表示される', async ({ page }) => {
    await expect(page.getByText('アクティビティ推移')).toBeVisible();
    await expect(page.getByRole('button', { name: '日別' })).toBeVisible();
    await expect(page.getByRole('button', { name: '時間別' })).toBeVisible();
    for (const preset of ['今日', '昨日', '過去7日', '過去30日', '過去90日']) {
      await expect(page.getByRole('button', { name: preset })).toBeVisible();
    }
    for (const metric of ['投稿', 'コメント', 'DM', '新規登録', 'いいね']) {
      await expect(page.getByRole('button', { name: metric, exact: true })).toBeVisible();
    }
  });

  test('粒度を時間別・日別に切り替えられる', async ({ page }) => {
    await page.getByRole('button', { name: '時間別' }).click();
    // クラッシュしないこと、グラフエリアが残ること
    await expect(page.getByText('アクティビティ推移')).toBeVisible();
    await page.getByRole('button', { name: '日別' }).click();
    await expect(page.getByText('アクティビティ推移')).toBeVisible();
  });

  test('プリセットで日付範囲を切り替えられる', async ({ page }) => {
    for (const preset of ['今日', '昨日', '過去7日', '過去90日', '過去30日']) {
      await page.getByRole('button', { name: preset }).click();
      await expect(page.getByText('アクティビティ推移')).toBeVisible();
    }
  });

  test('開始日が終了日より後の場合にエラーメッセージを表示する', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    const toInput = dateInputs.last();

    // 終了日を過去に固定してから、開始日をそれより未来にセット
    await toInput.fill('2026-06-01');
    await dateInputs.first().fill('2026-06-15');

    await expect(page.getByText('開始日が終了日より後になっています')).toBeVisible();
  });

  test('メトリクスのトグルボタンが動作する', async ({ page }) => {
    for (const metric of ['投稿', 'コメント', 'DM', '新規登録', 'いいね']) {
      const btn = page.getByRole('button', { name: metric, exact: true });
      // オフにする
      await btn.click();
      await expect(btn).toBeVisible();
      // オンに戻す
      await btn.click();
      await expect(btn).toBeVisible();
    }
  });
});
