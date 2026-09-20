// 寸法が未取得の画像メディアを一括で埋めるメンテナンス用ツール。
//
// アプリの通常動作でも、画像が表示されるたびに寸法は自己修復されていく
// (src/lib/reportMediaDimensions.ts)。ただし埋まるのは誰かが実際に見た画像だけなので、
// 古い画像はいつまでも残る。メンテナンス時間内に全件を確定させたいときにこれを使う。
//
// 測定はヘッドレスブラウザに行わせる。アプリの実行時とまったく同じエンジンで測るため、
// EXIF の回転も、ブラウザが表示できる形式（AVIF/HEIC なども含む）も自動的に揃う。
// サーバー側で画像をデコードする方式だと、形式ごとにデコーダを用意する必要があり、
// EXIF の解釈がブラウザとずれる余地も残る。
//
// メンテナンスモード中はマネージャ権限のトークンしか通らないため、管理者でログインする。
// 何度実行しても安全で、途中で止めても再開できる（サーバーが未設定のときだけ書き込む）。
//
//   node scripts/fill-media-dimensions.mjs --api http://localhost:8080/query \
//     --email admin@example.com --password 'xxx' [--dry-run] [--concurrency 8]
//
// 画像 URL に到達できない環境では --url-replace 'from|to' で書き換えられる
// （例: --url-replace 'host.docker.internal|localhost'）。
//
// 全メディアが埋まればこのツールごと削除できる。

import { chromium } from '@playwright/test';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const get = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  return {
    api: get('api', 'http://localhost:8080/query'),
    email: get('email'),
    password: get('password'),
    token: get('token'),
    batch: Number(get('batch', '200')),
    // 画像 URL は MINIO_PUBLIC_ENDPOINT の値で返る。ツールを動かす場所から
    // その host 名に到達できない場合（コンテナ向けの名前が入っているなど）に置換する。
    urlReplace: get('url-replace'),
    concurrency: Number(get('concurrency', '8')),
    dryRun: args.includes('--dry-run'),
  };
};

const gql = async (api, query, variables, token) => {
  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => ({}));
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join(', '));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return json.data;
};

const LOGIN = `
  mutation LoginAdministrator($input: LoginInput!) {
    loginAdministrator(input: $input) { token }
  }
`;
const LIST = `
  query AdminListMediaMissingDimensions($limit: Int!, $offset: Int!) {
    adminListMediaMissingDimensions(limit: $limit, offset: $offset) { ID url contentType }
  }
`;
const REPORT = `
  mutation ReportMediaDimensions($mediaID: ID!, $width: Int!, $height: Int!) {
    reportMediaDimensions(mediaID: $mediaID, width: $width, height: $height)
  }
`;

/** ヘッドレスブラウザで実際に読み込み、表示される向きの寸法を測る。 */
const measure = (page, url) =>
  page.evaluate(
    (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const done = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onload = done;
        img.onerror = () => resolve(null);
        // 応答が返らない画像で止まらないようにする
        setTimeout(() => resolve(null), 20000);
        img.src = src;
      }),
    url,
  );

const main = async () => {
  const opts = parseArgs();

  let token = opts.token;
  if (!token) {
    if (!opts.email || !opts.password) {
      console.error('--token か、--email と --password を指定してください');
      process.exit(2);
    }
    const data = await gql(opts.api, LOGIN, { input: { email: opts.email, password: opts.password } });
    token = data.loginAdministrator.token;
  }

  const [replaceFrom, replaceTo] = (opts.urlReplace ?? '').split('|');
  const rewrite = (url) => (replaceFrom ? url.split(replaceFrom).join(replaceTo ?? '') : url);

  const browser = await chromium.launch();
  const pages = await Promise.all(
    Array.from({ length: opts.concurrency }, async () => {
      const page = await browser.newPage();
      // 画像を読むだけなので、どこかのオリジンに一度だけ載せておく
      await page.setContent('<!doctype html><title>measure</title>');
      return page;
    }),
  );

  let filled = 0;
  let failed = 0;
  let offset = 0;
  const started = Date.now();

  for (;;) {
    const data = await gql(opts.api, LIST, { limit: opts.batch, offset }, token);
    const items = data.adminListMediaMissingDimensions;
    if (items.length === 0) break;

    // 並行に測る。ストレージ待ちが大半なので、並行数がそのまま時間短縮になる。
    const queue = items.slice();
    await Promise.all(
      pages.map(async (page) => {
        for (;;) {
          const media = queue.shift();
          if (!media) return;

          const url = rewrite(media.url);
          const size = await measure(page, url);
          if (!size || !size.width || !size.height) {
            failed++;
            console.log(`fail  ${media.ID} ${media.contentType} ${url}`);
            continue;
          }
          if (opts.dryRun) {
            filled++;
            console.log(`dry   ${media.ID} -> ${size.width}x${size.height}`);
            continue;
          }
          try {
            await gql(opts.api, REPORT, { mediaID: media.ID, ...size }, token);
            filled++;
            console.log(`ok    ${media.ID} -> ${size.width}x${size.height}`);
          } catch (e) {
            failed++;
            console.log(`fail  ${media.ID}: ${e.message}`);
          }
        }
      }),
    );

    // 書き込んだ分は次回の一覧から外れる。dry-run と失敗分は残るため、
    // 同じ行を読み直して止まらないよう offset を進める。
    offset += opts.dryRun ? items.length : failed;
    if (!opts.dryRun && failed === 0) offset = 0;
    if (items.length < opts.batch && (opts.dryRun || failed > 0)) break;
  }

  await browser.close();
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`完了: 記録 ${filled} 件 / 失敗 ${failed} 件 (${seconds}s)`);
  process.exit(failed > 0 ? 1 : 0);
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
