import { test, expect } from '@playwright/test';
import { dismissTermsConsentModalIfPresent } from '../support/terms';
import { loginAsSecondUser } from '../support/secondUser';
import { env } from '../support/env';

// この画面はミューテーション後に同じデータを2回取得しに行くなど再フェッチが
// 重なりやすく、その直後にクリックすると要素がDOMから外れて
// （detached）クリックが失敗することがある。クリック→効果の確認をセットにして
// 効果が出るまでリトライすることで、固定のsleepに頼らずに安定させる。
const retryClick = (action: () => Promise<void>, verify: () => Promise<void>) =>
  expect(async () => {
    await action();
    await verify();
  }).toPass({ timeout: 15000 });

test.describe('投稿の作成・表示・いいね・返信・編集・削除', () => {
  test('投稿を作成し、いいね・返信・編集・削除まで一通り行える', async ({ page, browser, request, baseURL }) => {
    page.on('dialog', (dialog) => dialog.accept());

    const postContent = `E2Eテスト投稿 ${Date.now()}`;
    const editedPostContent = `${postContent}（編集済み）`;
    const replyContent = `E2Eテスト返信 ${Date.now()}`;

    // メイン投稿のいいねボタンは large 付きで「いいね 0いいね」のように件数の後ろに
    // 「いいね」が付くため、件数だけが違う返信側（「いいね 0」）と部分一致してしまう。
    // 件数まで含めた完全な文字列で区別する。
    const postLikeButtonNamed = (count: number) =>
      page.getByRole('button', { name: `いいね ${count}いいね` });

    await test.step('投稿を作成すると一覧に表示される', async () => {
      await page.goto('/home');
      await dismissTermsConsentModalIfPresent(page);

      await page.getByPlaceholder('新規投稿').fill(postContent);
      await page.getByRole('button', { name: '投稿', exact: true }).click();
      await expect(page.getByText(postContent)).toBeVisible();
    });

    let mainPostUrl = '';

    await test.step('投稿をクリックすると詳細ページに遷移する', async () => {
      await retryClick(
        () => page.getByText(postContent).click(),
        () => expect(page).toHaveURL(/\/posts\/.+/, { timeout: 2000 }),
      );
      await expect(page.getByRole('heading', { name: '投稿' })).toBeVisible();
      await expect(page.getByText(postContent)).toBeVisible();
      mainPostUrl = page.url();
    });

    await test.step('自分の投稿はいいねできない（件数が変わらない）', async () => {
      // バックエンドが「ユーザーは自分の投稿をお気に入りにできません」を返す仕様。
      // LikeButton側はこのエラーを握り潰すだけ（finallyでdisabledを解除するのみ）
      // なので、件数が変化しないことだけが観測可能な挙動。
      await postLikeButtonNamed(0).click();
      await page.waitForTimeout(500);
      await expect(postLikeButtonNamed(0)).toBeVisible();
    });

    await test.step('他のユーザーがいいねすると件数が増える', async () => {
      const postUrl = page.url();
      const base = baseURL ?? env.baseURL;
      const otherUserPage = await loginAsSecondUser(browser, request, base);
      try {
        await otherUserPage.goto(postUrl);
        await dismissTermsConsentModalIfPresent(otherUserPage);
        await otherUserPage.getByRole('button', { name: 'いいね 0いいね' }).click();
        await expect(otherUserPage.getByRole('button', { name: 'いいね 1いいね' })).toBeVisible();
      } finally {
        await otherUserPage.context().close();
      }
    });

    await test.step('返信すると返信一覧に表示され、返信件数が増える', async () => {
      await page.getByPlaceholder('返信する...').fill(replyContent);
      await page.getByRole('button', { name: '返信する' }).click();
      await expect(page.getByText(replyContent)).toBeVisible();
      await expect(page.getByText('1 件の返信')).toBeVisible();
    });

    await test.step('返信も自分が投稿者のためいいねできない（件数が変わらない）', async () => {
      // 返信側は large無しなので「いいね 0」が完全なアクセシブルネーム。
      // ただしメイン投稿側「いいね 0いいね」は「いいね 0」を部分文字列として含むため
      // exact指定で返信側だけに絞る。他ユーザーでの成功パターンはメイン投稿側で
      // 検証済みなので、ここでは自分の投稿はいいねできない仕様の確認のみ行う。
      const replyLikeButton = page.getByRole('button', { name: 'いいね 0', exact: true });
      await replyLikeButton.click();
      await page.waitForTimeout(500);
      await expect(replyLikeButton).toBeVisible();
    });

    await test.step('投稿を編集すると内容が更新される', async () => {
      // この時点ではrootPostが無いためメニューボタンは1つだけだが、後続のステップ
      // （返信詳細ページ）ではrootPost用のメニューも増えるため.last()で統一して
      // 「自分が今見ている投稿本体」のメニューを指す。
      await retryClick(
        () => page.getByRole('button', { name: 'メニュー' }).last().click(),
        () => expect(page.getByRole('button', { name: '編集' })).toBeVisible({ timeout: 2000 }),
      );
      await page.getByRole('button', { name: '編集' }).click();

      await page.getByPlaceholder('投稿を編集...').fill(editedPostContent);
      await page.getByRole('button', { name: '保存する' }).click();
      await expect(page.getByText(editedPostContent)).toBeVisible();
    });

    await test.step('返信の詳細を開いて削除できる', async () => {
      await retryClick(
        () => page.getByText(replyContent).click(),
        () => expect(page).toHaveURL(/\/posts\/.+/, { timeout: 2000 }),
      );
      await expect(page.getByText(replyContent)).toBeVisible();

      // 返信の詳細ページにはrootPost（編集済みのメイン投稿）もPostCardとして
      // 表示され、そちらにも「メニュー」ボタンがあるため2つ存在する。
      // DOM上はrootPost用が先、自分（返信）の本体用が後に出力されるため.last()で
      // 返信自体のメニューを指す。
      await retryClick(
        () => page.getByRole('button', { name: 'メニュー' }).last().click(),
        () => expect(page.getByRole('button', { name: '削除' })).toBeVisible({ timeout: 2000 }),
      );
      await page.getByRole('button', { name: '削除' }).click();

      // 削除リクエスト完了後にnavigate(-1)でメイン投稿の詳細ページに戻るが、これは
      // クリックハンドラ内の非同期処理なので、すぐにreloadすると navigate(-1) が
      // 実行される前に返信ページ自身をリロードしてしまう（削除済みのためpostが
      // 見つからない画面になる）。まずメイン投稿のURLに戻るのを待つ。
      await page.waitForURL(mainPostUrl);

      // 戻り先のSWRキャッシュは削除前の状態のまま残っており、すぐには再フェッチ
      // されず返信が表示され続けることがある（短時間に元のページへ戻ると起きやすい）。
      // 最新状態を確実に見るため明示的にリロードする。
      await page.reload();
      await dismissTermsConsentModalIfPresent(page);
      await expect(page.getByText(replyContent)).toHaveCount(0);
    });

    await test.step('投稿を削除すると一覧から消える', async () => {
      // 返信削除後はnavigate(-1)でメイン投稿の詳細ページに戻る
      await expect(page).toHaveURL(/\/posts\/.+/);
      await expect(page.getByText(editedPostContent)).toBeVisible();

      await retryClick(
        () => page.getByRole('button', { name: 'メニュー' }).last().click(),
        () => expect(page.getByRole('button', { name: '削除' })).toBeVisible({ timeout: 2000 }),
      );
      await page.getByRole('button', { name: '削除' }).click();
      await expect(page).toHaveURL(/\/home$/);
      await expect(page.getByText(editedPostContent)).toHaveCount(0);
    });
  });
});
