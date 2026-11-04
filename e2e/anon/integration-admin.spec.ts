import { test, expect } from '@playwright/test';

// Local mocked API: exercise the merged UI without credentials or production access.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem('space_admin_token', 'integration-test'));
  await context.route('**/query', async (route) => {
    const query = route.request().postDataJSON()?.query as string;
    let data = {};
    if (query.includes('AdminCurrentSemester')) data = { currentSemester: { year: 2026, semester: '後期' } };
    if (query.includes('AdminCourseImportStatus')) data = { adminCourseImportStatus: { state: 'SUCCEEDED', year: 2026, dryRun: true, syncRunID: 'run1' } };
    if (query.includes('AdminListCourseYears')) data = { adminListCourseYears: [2026, 2025] };
    if (query.includes('AdminListCourses(')) data = { adminListCourses: { total: 1, items: [{ ID: 'course1', roomID: 'room1', courseName: '統合テスト授業', teacherName: '先生', dayOfWeek: '月', period: 1, year: 2026, semester: '後期', createdAt: '', discontinued: true, registeredCount: 3, messageCount: 7 }] } };
    await route.fulfill({ json: { data } });
  });
});

test('授業同期のドライランと履歴リンクを維持する', async ({ page }) => {
  await page.goto('/admin/courses');
  await expect(page.getByRole('checkbox', { name: /ドライラン/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'ドライランを開始' })).toBeVisible();
  await expect(page.getByRole('link', { name: '変更予定の内容を見る' })).toHaveAttribute('href', '/admin/course-sync?run=run1');
  await expect(page.getByRole('link', { name: '同期の履歴・確認待ちを見る' })).toBeVisible();
});

test('授業チャット管理で廃止表示・集計・ソート・年度学期曜日フィルターを維持する', async ({ page }) => {
  await page.goto('/admin/course-chats');
  await expect(page.getByText('統合テスト授業', { exact: false })).toBeVisible();
  await expect(page.getByText('廃止', { exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '7 件', exact: true })).toBeVisible();
  const sorted = page.waitForRequest((request) => {
    if (!request.url().endsWith('/query') || request.method() !== 'POST') return false;
    const body = request.postDataJSON();
    return body.query?.includes('AdminListCourses(') && body.variables.sortBy === 'messageCount' && body.variables.sortOrder === 'DESC';
  });
  await page.getByRole('columnheader', { name: /メッセージ数/ }).click();
  await sorted;
  const filtered = page.waitForRequest((request) => {
    if (!request.url().endsWith('/query') || request.method() !== 'POST') return false;
    const body = request.postDataJSON();
    return body.query?.includes('AdminListCourses(') && body.variables.year === 2025 && body.variables.semester === '後期' && body.variables.dayOfWeek === '月';
  });
  await page.getByLabel('年度', { exact: true }).selectOption('2025');
  await page.getByLabel('学期', { exact: true }).selectOption('後期');
  await page.getByLabel('曜日', { exact: true }).selectOption('月');
  await filtered;
});
