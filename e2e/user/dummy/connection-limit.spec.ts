import { test, expect } from '@playwright/test';
import http from 'http';
import https from 'https';
import { loginUserViaApi } from '../../support/api';
import {
  createDummyUser,
  deleteDummyUser,
  getAdminToken,
  consentDummyUserToTerms,
  type DummyUser,
} from '../../support/adminApi';
import { env } from '../../support/env';

// fetch() をブラウザコンテキストで使うと、ストリーミング応答を保持しつつ
// AbortController でキャンセルする挙動が Chromium + Vite proxy 経由で不安定になる。
// Node.js の http モジュールで直接接続することでその問題を回避する。
const openSSE = (
  baseURL: string,
  token: string,
): Promise<{ status: number; close: () => void }> =>
  new Promise((resolve, reject) => {
    const url = new URL('/events', baseURL);
    url.searchParams.set('token', token);
    const mod = url.protocol === 'https:' ? https : http;

    const req = mod.get(
      url.toString(),
      { headers: { Accept: 'text/event-stream', 'Cache-Control': 'no-cache' } },
      (res) => {
        res.on('data', () => {}); // バッファ詰まりを防ぐため消費する
        res.on('error', () => {});
        resolve({ status: res.statusCode ?? 0, close: () => req.destroy() });
      },
    );
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('SSE connect timeout')));
  });

test.describe('接続数上限', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken: string;
  let dummy: DummyUser;
  let base: string;

  test.beforeAll(async ({ request, baseURL }) => {
    test.setTimeout(60000);
    base = baseURL ?? env.baseURL;
    adminToken = await getAdminToken(request, base);
    dummy = await createDummyUser(request, base, adminToken);
    const { token } = await loginUserViaApi(request, base, dummy.email, dummy.password);
    await consentDummyUserToTerms(request, base, token);
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(60000);
    const freshToken = await getAdminToken(request, base).catch(() => adminToken);
    await deleteDummyUser(request, base, freshToken, dummy.ID);
  });

  test('SSE: 5本目まで接続でき6本目は429、1本解放で再接続できる', async ({ request, baseURL }) => {
    test.setTimeout(30000);
    const b = base ?? baseURL ?? env.baseURL;
    const { token } = await loginUserViaApi(request, b, dummy.email, dummy.password);

    const conns: Array<{ status: number; close: () => void }> = [];
    try {
      // 5本接続（上限ちょうど、全て成功するはず）
      for (let i = 0; i < 5; i++) {
        const conn = await openSSE(b, token);
        conns.push(conn);
        expect(conn.status).toBe(200);
      }

      // 6本目は上限超過 → HTTP 429
      const conn6 = await openSSE(b, token);
      conn6.close();
      expect(conn6.status).toBe(429);

      // 1本解放（Go側で defer hub.Unsubscribe が走りカウントが減る）
      conns[0].close();
      await new Promise((r) => setTimeout(r, 500));

      // 解放後は再接続できる
      const connNew = await openSSE(b, token);
      conns.push(connNew); // finally でクローズされる
      expect(connNew.status).toBe(200);
    } finally {
      for (const conn of conns) conn.close();
    }
  });

  test('WebSocket: 5本目まで接続でき6本目は拒否、1本解放で再接続できる', async ({ page, request, baseURL }) => {
    test.setTimeout(60000);
    const b = base ?? baseURL ?? env.baseURL;
    const { token } = await loginUserViaApi(request, b, dummy.email, dummy.password);
    // Vite proxy が ws: true で /query を WebSocket にアップグレードする
    const wsUrl = new URL('/query', b).toString().replace(/^http/, 'ws');

    // page.evaluate で使う WebSocket は同一オリジンである必要がある
    await page.goto('/login');

    const results = await page.evaluate(
      async ({ wsUrl, token }: { wsUrl: string; token: string }) => {
        const results: boolean[] = [];
        const sockets: WebSocket[] = [];

        // graphql-transport-ws プロトコルで接続し、connection_ack が来れば成功
        const tryConnect = (): Promise<{ ok: boolean; ws: WebSocket | null }> =>
          new Promise((resolve) => {
            const socket = new WebSocket(wsUrl, 'graphql-transport-ws');
            let done = false;

            const finish = (ok: boolean) => {
              if (done) return;
              done = true;
              clearTimeout(timer);
              if (!ok && socket.readyState < WebSocket.CLOSING) socket.close();
              resolve({ ok, ws: ok ? socket : null });
            };

            socket.onopen = () => {
              socket.send(
                JSON.stringify({
                  type: 'connection_init',
                  payload: { Authorization: `Bearer ${token}` },
                }),
              );
            };
            socket.onmessage = (e: MessageEvent) => {
              const msg = JSON.parse(e.data as string) as { type: string };
              if (msg.type === 'connection_ack') finish(true);
              else if (msg.type === 'connection_error') finish(false);
            };
            // 上限超過時はサーバーが close frame を送って切断する
            socket.onclose = () => finish(false);
            socket.onerror = () => finish(false);
            // サーバーが無応答の場合のフォールバック
            const timer = setTimeout(() => finish(false), 8000);
          });

        // 5本接続（全て connection_ack を受け取るはず）
        for (let i = 0; i < 5; i++) {
          const { ok, ws } = await tryConnect();
          results.push(ok);
          if (ws) sockets.push(ws);
        }

        // 6本目は上限超過 → 拒否
        const r6 = await tryConnect();
        results.push(r6.ok);
        if (r6.ws) r6.ws.close();

        // 1本解放（CloseFunc で wsLimiter.Release が走る）
        if (sockets[0]) {
          await new Promise<void>((resolve) => {
            sockets[0].addEventListener('close', () => resolve(), { once: true });
            sockets[0].close();
          });
        }

        // close frame 後もサーバー側の limiter 解放には僅かな遅延があり得るため、
        // 固定 sleep ではなく接続可能になるまで期限付きで再試行する。
        const deadline = Date.now() + 10000;
        let r7: { ok: boolean; ws: WebSocket | null } = { ok: false, ws: null };
        while (!r7.ok && Date.now() < deadline) {
          r7 = await tryConnect();
          if (!r7.ok) await new Promise((resolve) => setTimeout(resolve, 250));
        }
        results.push(r7.ok);

        // 全クローズ
        for (let i = 1; i < sockets.length; i++) sockets[i].close();
        if (r7.ws) r7.ws.close();

        return results;
      },
      { wsUrl, token },
    );

    // 最初の5本: true、6本目: false、解放後の再接続: true
    expect(results.slice(0, 5)).toEqual([true, true, true, true, true]);
    expect(results[5]).toBe(false);
    expect(results[6]).toBe(true);
  });
});
