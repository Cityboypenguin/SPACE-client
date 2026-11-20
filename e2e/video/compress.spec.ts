import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  checkSource,
  initialVideoBitrate,
  isPassthroughEligible,
  nextVideoBitrate,
  targetFrameRate,
  targetSize,
} from '../../src/lib/video/plan';
import { VIDEO_MAX_BYTES, VIDEO_MIN_BITRATE, VIDEO_TARGET_BITRATE } from '../../src/lib/video/constants';

// 動画の圧縮（src/lib/video）を、実際のブラウザーで確かめる。
// サーバーは要らない（Vite の開発サーバーだけで動く）。動画は scripts/gen-video-fixtures.sh で作る。
//
//   npx playwright test --project=video

const fixtureDir = resolve(dirname(fileURLToPath(import.meta.url)), '../fixtures/video');

type Outcome =
  | { ok: true; size: number; width: number; height: number; durationSec: number; hasAudio: boolean; thumbnailType: string; thumbnailSize: number; videoType: string; attempts: number; passthrough: boolean; head: number[] }
  | { ok: false; message: string };

const compress = async (page: Page, name: string, type: string): Promise<Outcome> => {
  const bytes = readFileSync(resolve(fixtureDir, name)).toString('base64');
  await page.goto('/e2e/fixtures/video-harness.html');
  await page.waitForFunction(() => (window as unknown as { __videoReady?: boolean }).__videoReady === true);
  return page.evaluate(async ({ bytes, name, type }) => {
    const bin = Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0));
    const file = new File([bin], name, { type });
    const api = (window as unknown as { __video: typeof import('../../src/lib/video/compressVideo') }).__video;
    const pre = api.precheckVideoFile(file);
    if (pre) return { ok: false as const, message: pre };
    try {
      const r = await api.compressVideo(file, () => {}).promise;
      const head = Array.from(new Uint8Array(await r.video.slice(0, 64).arrayBuffer()));
      return {
        ok: true as const,
        size: r.video.size,
        width: r.width,
        height: r.height,
        durationSec: r.durationSec,
        hasAudio: r.hasAudio,
        thumbnailType: r.thumbnail.type,
        thumbnailSize: r.thumbnail.size,
        videoType: r.video.type,
        attempts: r.attempts,
        passthrough: r.passthrough,
        head,
      };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : String(e) };
    }
  }, { bytes, name, type });
};

// 先頭の箱の並びが ftyp → moov（moov が mdat より前＝再生開始が速い、サーバーもこれを要求する）。
const boxTypesAtHead = (head: number[]): string[] => {
  const types: string[] = [];
  let off = 0;
  while (off + 8 <= head.length) {
    const size = (head[off] << 24) | (head[off + 1] << 16) | (head[off + 2] << 8) | head[off + 3];
    types.push(String.fromCharCode(...head.slice(off + 4, off + 8)));
    if (size <= 0) break;
    off += size;
  }
  return types;
};

test.describe('圧縮の計画（純粋な関数）', () => {
  test('解像度は 1280×720 / 720×1280 に収め、拡大しない', () => {
    expect(targetSize(1920, 1080)).toEqual({ width: 1280, height: 720 });
    expect(targetSize(1080, 1920)).toEqual({ width: 720, height: 1280 });
    expect(targetSize(3840, 2160)).toEqual({ width: 1280, height: 720 });
    expect(targetSize(640, 360)).toEqual({ width: 640, height: 360 });
    // 縦横比が 16:9 でない動画も比を保つ（偶数に丸める）。
    expect(targetSize(1440, 1080)).toEqual({ width: 960, height: 720 });
    expect(targetSize(641, 361)).toEqual({ width: 640, height: 360 });
  });

  test('fps は 30 を超えるときだけ 30 にする', () => {
    expect(targetFrameRate(60)).toBe(30);
    expect(targetFrameRate(30)).toBeUndefined();
    expect(targetFrameRate(29.97)).toBeUndefined();
    expect(targetFrameRate(24)).toBeUndefined();
  });

  test('長さ・解像度の事前チェック', () => {
    expect(checkSource(60, 1920, 1080).ok).toBe(true);
    expect(checkSource(60.04, 1920, 1080).ok).toBe(true);
    expect(checkSource(60.2, 1920, 1080).ok).toBe(false);
    expect(checkSource(10, 3840, 2160).ok).toBe(true);
    expect(checkSource(10, 4096, 2160).ok).toBe(true);
    expect(checkSource(10, 4097, 2160).ok).toBe(false);
    expect(checkSource(10, 7680, 4320).ok).toBe(false);
  });

  test('ビットレートは 2.5Mbps を上限に 25MB に収まるよう決め、超えたら下げる', () => {
    expect(initialVideoBitrate(10, true)).toBe(VIDEO_TARGET_BITRATE);
    const at60 = initialVideoBitrate(60, true);
    expect(at60).toBeLessThanOrEqual(VIDEO_TARGET_BITRATE);
    // 60秒・音声128kbps で 25MB に収まる見積もり。
    expect(((at60 + 128_000) * 60) / 8).toBeLessThanOrEqual(VIDEO_MAX_BYTES);
    const next = nextVideoBitrate(2_000_000, 30_000_000);
    expect(next).not.toBeNull();
    expect(next!).toBeLessThan(2_000_000 * (25 / 30));
    expect(nextVideoBitrate(VIDEO_MIN_BITRATE, VIDEO_MAX_BYTES * 2)).toBeNull();
  });

  test('圧縮できない端末で、そのまま送ってよい動画', () => {
    const base = { mimeType: 'video/mp4', videoCodec: 'avc', audioCodec: 'aac', width: 1280, height: 720, fps: 30, durationSec: 60, sizeBytes: VIDEO_MAX_BYTES };
    expect(isPassthroughEligible(base)).toBe(true);
    expect(isPassthroughEligible({ ...base, audioCodec: null })).toBe(true);
    expect(isPassthroughEligible({ ...base, sizeBytes: VIDEO_MAX_BYTES + 1 })).toBe(false);
    expect(isPassthroughEligible({ ...base, videoCodec: 'hevc' })).toBe(false);
    expect(isPassthroughEligible({ ...base, mimeType: 'video/quicktime' })).toBe(false);
    expect(isPassthroughEligible({ ...base, width: 1920, height: 1080 })).toBe(false);
    expect(isPassthroughEligible({ ...base, fps: 60 })).toBe(false);
  });
});

test.describe('ブラウザーでの圧縮', () => {
  test.describe.configure({ timeout: 120_000 });

  test('1080p 横向きは 1280×720 の H.264/AAC MP4 になり、moov が先頭にある', async ({ page }) => {
    const r = await compress(page, 'fhd_landscape.mp4', 'video/mp4');
    expect(r.ok, JSON.stringify(r)).toBe(true);
    if (!r.ok) return;
    expect([r.width, r.height]).toEqual([1280, 720]);
    expect(r.size).toBeLessThanOrEqual(VIDEO_MAX_BYTES);
    expect(r.videoType).toBe('video/mp4');
    expect(r.hasAudio).toBe(true);
    expect(r.thumbnailType).toBe('image/jpeg');
    expect(r.thumbnailSize).toBeGreaterThan(0);
    expect(boxTypesAtHead(r.head).slice(0, 2)).toEqual(['ftyp', 'moov']);
  });

  test('1080p 縦向き 60fps は 720×1280 になる', async ({ page }) => {
    const r = await compress(page, 'fhd_portrait_60fps.mp4', 'video/mp4');
    expect(r.ok, JSON.stringify(r)).toBe(true);
    if (!r.ok) return;
    expect([r.width, r.height]).toEqual([720, 1280]);
  });

  test('4K（音声なし）も 720p に収まる', async ({ page }) => {
    const r = await compress(page, 'uhd_noaudio.mp4', 'video/mp4');
    expect(r.ok, JSON.stringify(r)).toBe(true);
    if (!r.ok) return;
    expect([r.width, r.height]).toEqual([1280, 720]);
    expect(r.hasAudio).toBe(false);
  });

  test('720p 未満は拡大しない', async ({ page }) => {
    const r = await compress(page, 'small_360p.mp4', 'video/mp4');
    expect(r.ok, JSON.stringify(r)).toBe(true);
    if (!r.ok) return;
    expect([r.width, r.height]).toEqual([640, 360]);
  });

  test('HEVC の MOV（iPhone の録画に近い形）も H.264 の MP4 にできる', async ({ page }) => {
    const r = await compress(page, 'hevc_720p.mov', 'video/quicktime');
    // HEVC をデコードできない環境では、理由を出して断ることを確かめる。
    if (!r.ok) {
      expect(r.message).toMatch(/端末|変換|圧縮/);
      return;
    }
    expect([r.width, r.height]).toEqual([1280, 720]);
  });

  test('60秒を超える動画は断る', async ({ page }) => {
    const r = await compress(page, 'too_long_61s.mp4', 'video/mp4');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toContain('60秒以内');
  });

  test('4K を超える解像度は断る', async ({ page }) => {
    const r = await compress(page, 'over_4k.mp4', 'video/mp4');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toContain('4K');
  });

  test('壊れたファイル・対応していない形式は理由を出して断る', async ({ page }) => {
    const broken = await compress(page, 'broken.mp4', 'video/mp4');
    expect(broken.ok).toBe(false);
    const wrongType = await compress(page, 'broken.mp4', 'application/pdf');
    expect(wrongType.ok).toBe(false);
    if (!wrongType.ok) expect(wrongType.message).toContain('対応していません');
  });

  test('圧縮中にキャンセルできる', async ({ page }) => {
    const bytes = readFileSync(resolve(fixtureDir, 'uhd_noaudio.mp4')).toString('base64');
    await page.goto('/e2e/fixtures/video-harness.html');
    await page.waitForFunction(() => (window as unknown as { __videoReady?: boolean }).__videoReady === true);
    const result = await page.evaluate(async (bytes) => {
      const bin = Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0));
      const file = new File([bin], 'a.mp4', { type: 'video/mp4' });
      const api = (window as unknown as { __video: typeof import('../../src/lib/video/compressVideo') }).__video;
      const job = api.compressVideo(file, () => {});
      setTimeout(() => job.cancel(), 50);
      try {
        await job.promise;
        return 'finished';
      } catch (e) {
        return e instanceof Error ? e.message : String(e);
      }
    }, bytes);
    expect(result).toBe('canceled');
  });
});
