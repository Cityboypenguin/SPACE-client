import {
  AUDIO_TARGET_BITRATE,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_DURATION_SEC,
  VIDEO_MAX_FPS,
  VIDEO_MAX_LONG_SIDE,
  VIDEO_MAX_SHORT_SIDE,
  VIDEO_MAX_SOURCE_LONG_SIDE,
  VIDEO_MAX_SOURCE_SHORT_SIDE,
  VIDEO_MIN_BITRATE,
  VIDEO_TARGET_BITRATE,
} from './constants';

// 圧縮の計画（出力の大きさ・ビットレート）を決める純粋な関数。Worker からも
// テストからも使えるよう、ブラウザーの API には触らない。

// 長さの判定に持たせる幅。コンテナーの丸めで 60.000 秒の動画が 60.02 秒と読めることがある。
const DURATION_EPSILON_SEC = 0.05;

export type SourceCheck = { ok: true } | { ok: false; message: string };

// checkSource は元動画が投稿できるものかを見る（長さと解像度）。
export const checkSource = (durationSec: number, width: number, height: number): SourceCheck => {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return { ok: false, message: '動画の長さを読み取れませんでした。' };
  }
  if (durationSec > VIDEO_MAX_DURATION_SEC + DURATION_EPSILON_SEC) {
    return { ok: false, message: `動画は${VIDEO_MAX_DURATION_SEC}秒以内にしてください（この動画は${Math.ceil(durationSec)}秒です）。` };
  }
  if (width <= 0 || height <= 0) {
    return { ok: false, message: '動画の解像度を読み取れませんでした。' };
  }
  if (Math.max(width, height) > VIDEO_MAX_SOURCE_LONG_SIDE || Math.min(width, height) > VIDEO_MAX_SOURCE_SHORT_SIDE) {
    return { ok: false, message: '4Kを超える解像度の動画は投稿できません。' };
  }
  return { ok: true };
};

// even は H.264 の 4:2:0 で要る偶数へ丸める（切り捨て、最小2）。
const even = (n: number) => Math.max(2, Math.floor(n / 2) * 2);

// targetSize は出力の縦横。アスペクト比を保ち、横向きは 1280×720、縦向きは 720×1280 に収める。
// 元が小さければ拡大しない。
export const targetSize = (width: number, height: number): { width: number; height: number } => {
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  const scale = Math.min(1, VIDEO_MAX_LONG_SIDE / long, VIDEO_MAX_SHORT_SIDE / short);
  return { width: even(width * scale), height: even(height * scale) };
};

// targetFrameRate は出力の fps。30 を超えるときだけ 30 にし、それ以下は元のまま（undefined）。
export const targetFrameRate = (sourceFps: number): number | undefined =>
  Number.isFinite(sourceFps) && sourceFps > VIDEO_MAX_FPS + 0.5 ? VIDEO_MAX_FPS : undefined;

// 容量の見積もりに取る余裕。コンテナーの見出しや、エンコーダーが目標を少し超えるぶん。
const SIZE_HEADROOM = 0.92;

// initialVideoBitrate は1回目の映像のビットレート。目安の 2.5Mbps を上限に、
// 長さから「25MB に収まる」ビットレートを出して小さい方を使う。
export const initialVideoBitrate = (durationSec: number, hasAudio: boolean): number => {
  const totalBudget = (VIDEO_MAX_BYTES * 8 * SIZE_HEADROOM) / Math.max(durationSec, 1);
  const audio = hasAudio ? AUDIO_TARGET_BITRATE : 0;
  return Math.max(VIDEO_MIN_BITRATE, Math.min(VIDEO_TARGET_BITRATE, Math.floor(totalBudget - audio)));
};

// nextVideoBitrate は 25MB を超えたときの次のビットレート。超えた比率で下げ、さらに1割引く。
// 最低値を下回るなら null（諦める）。
export const nextVideoBitrate = (current: number, producedBytes: number): number | null => {
  const next = Math.floor(current * (VIDEO_MAX_BYTES / producedBytes) * 0.9);
  return next < VIDEO_MIN_BITRATE ? null : next;
};

export type PassthroughInfo = {
  mimeType: string;
  videoCodec: string | null;
  audioCodec: string | null;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  sizeBytes: number;
};

// isPassthroughEligible は、端末で圧縮できないときに元動画をそのまま送ってよいか
// （MP4・H.264/AAC・720p・30fps・25MB 以内）。
export const isPassthroughEligible = (s: PassthroughInfo): boolean =>
  s.mimeType.startsWith('video/mp4') &&
  s.videoCodec === 'avc' &&
  (s.audioCodec === null || s.audioCodec === 'aac') &&
  Math.max(s.width, s.height) <= VIDEO_MAX_LONG_SIDE &&
  Math.min(s.width, s.height) <= VIDEO_MAX_SHORT_SIDE &&
  s.fps <= VIDEO_MAX_FPS + 0.5 &&
  s.durationSec <= VIDEO_MAX_DURATION_SEC + DURATION_EPSILON_SEC &&
  s.sizeBytes <= VIDEO_MAX_BYTES;
