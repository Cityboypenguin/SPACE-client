// 動画の圧縮を行う Web Worker。
//
// 画面（メインスレッド）で圧縮すると、デコードとエンコードの段取り（フレームの受け渡し・
// サイズ変更）で UI が固まるので、Worker に分けてある。圧縮そのものは WebCodecs
// （端末のハードウェアエンコーダー）で行い、Mediabunny がコンテナーの読み書きと
// 段取りを受け持つ。ffmpeg.wasm は使わない（数十MBの読み込みと、ソフトウェア処理の遅さ・
// メモリ消費のため。docs/video-posts.md 参照）。
//
// キャンセルは画面側が Worker を terminate する。途中のメモリはそれで全部解放される。

import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  CanvasSink,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  canEncodeAudio,
  canEncodeVideo,
  type ConversionAudioOptions,
  type InputVideoTrack,
} from 'mediabunny';
import {
  AUDIO_TARGET_BITRATE,
  THUMBNAIL_LONG_SIDE,
  THUMBNAIL_MAX_BYTES,
  VIDEO_MAX_ATTEMPTS,
  VIDEO_MAX_BYTES,
} from './constants';
import type { CompressPhase, CompressRequest, CompressResponse, CompressResult } from './messages';
import {
  checkOutput,
  checkSource,
  initialVideoBitrate,
  isPassthroughEligible,
  nextVideoBitrate,
  targetFrameRate,
  targetSize,
} from './plan';

// lib に WebWorker を入れていないので、使う口だけ型を付ける。
const ctx = self as unknown as {
  postMessage: (msg: CompressResponse) => void;
  onmessage: ((e: MessageEvent<CompressRequest>) => void) | null;
};

class UserFacingError extends Error {}

const post = (msg: CompressResponse) => ctx.postMessage(msg);
const progress = (phase: CompressPhase, value: number, attempt = 1) =>
  post({ type: 'progress', phase, progress: Math.max(0, Math.min(1, value)), attempt });

ctx.onmessage = (e) => {
  if (e.data.type !== 'start') return;
  compress(e.data.file)
    .then((result) => post({ type: 'done', result }))
    .catch((err: unknown) => {
      const message = err instanceof UserFacingError
        ? err.message
        : '動画を圧縮できませんでした。別の動画を選ぶか、時間をおいてもう一度お試しください。';
      if (!(err instanceof UserFacingError)) console.error('video compression failed', err);
      post({ type: 'error', message });
    });
};

// compress は「確認 → 圧縮 → 圧縮した後の確認 → サムネイル」の順に進める。
//
// 確認では、ファイルの先頭の情報（コンテナーの表）だけを読み、デコードはしない。
// 長さ・解像度・映像の有無・音声を変換できるか・この端末で圧縮できるか（できなければ
// そのまま送れる規格内の動画か）をここで全部確かめ、通らなければ圧縮を始めずに理由を返す。
async function compress(file: File): Promise<CompressResult> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    if (!(await input.canRead())) {
      throw new UserFacingError('この形式の動画には対応していません。MP4 または MOV の動画を選んでください。');
    }
    const video = await input.getPrimaryVideoTrack();
    if (!video) throw new UserFacingError('映像が含まれていないファイルです。');
    const audio = await input.getPrimaryAudioTrack();

    const durationSec = await input.computeDuration();
    const width = await video.getDisplayWidth();
    const height = await video.getDisplayHeight();
    const check = checkSource(durationSec, width, height);
    if (!check.ok) throw new UserFacingError(check.message);

    const stats = await video.computePacketStats(120);
    const sourceFps = stats.averagePacketRate;
    const mimeType = await input.getMimeType();
    const videoCodec = await video.getCodec();
    const audioCodec = audio ? await audio.getCodec() : null;

    const size = targetSize(width, height);
    const frameRate = targetFrameRate(sourceFps);
    const hasAudio = audio !== null;

    // 音声: AAC で書き出せるならそうする（128kbps）。書き出せない端末（iOS 26 未満など）でも、
    // 元が AAC なら変換せずにそのまま写せる。どちらでもなければ断る。
    const canAAC = hasAudio
      ? await canEncodeAudio('aac', { bitrate: AUDIO_TARGET_BITRATE, numberOfChannels: Math.min(audio.numberOfChannels, 2), sampleRate: audio.sampleRate })
      : true;
    if (hasAudio && !canAAC && audioCodec !== 'aac') {
      throw new UserFacingError('この端末ではこの動画の音声を変換できません。別の端末でお試しください。');
    }
    const audioOptions: ConversionAudioOptions | undefined = !hasAudio
      ? undefined
      : canAAC
        ? { codec: 'aac', bitrate: AUDIO_TARGET_BITRATE, numberOfChannels: Math.min(audio.numberOfChannels, 2) }
        : { codec: 'aac' };

    const canDecode = await video.canDecode();
    const canAVC = canDecode && await canEncodeVideo('avc', { width: size.width, height: size.height, bitrate: initialVideoBitrate(durationSec, hasAudio) });

    const passthrough = !canAVC;
    if (passthrough && !isPassthroughEligible({ mimeType, videoCodec, audioCodec, width, height, fps: sourceFps, durationSec, sizeBytes: file.size })) {
      throw new UserFacingError('この端末では動画を圧縮できません。720p・30fps・25MB 以内の MP4（H.264/AAC）を選ぶか、別の端末でお試しください。');
    }
    // ここまでで投稿できる動画だと分かった。ここから圧縮する。
    post({ type: 'checked' });

    if (passthrough) {
      // 端末で圧縮できない。元が規格内なので、moov を先頭へ移すだけ（デコードしない）で送る。
      const out = await runConversion(input, { codec: 'avc' }, audioOptions ? { codec: 'aac' } : undefined, 1);
      await verifyOutput(out);
      return finish(out, width, height, durationSec, hasAudio, true, 1);
    }

    let bitrate = initialVideoBitrate(durationSec, hasAudio);
    for (let attempt = 1; attempt <= VIDEO_MAX_ATTEMPTS; attempt++) {
      const out = await runConversion(input, {
        codec: 'avc',
        width: size.width,
        height: size.height,
        fit: 'contain',
        bitrate,
        frameRate,
        keyFrameInterval: 2,
        forceTranscode: true,
        // 回転は画素に焼き込む（縦向きの動画を、どのプレイヤーでも縦に出すため）。
        allowRotationMetadata: false,
      }, audioOptions, attempt);
      if (out.byteLength <= VIDEO_MAX_BYTES) {
        await verifyOutput(out);
        return finish(out, size.width, size.height, durationSec, hasAudio, false, attempt);
      }
      const next = nextVideoBitrate(bitrate, out.byteLength);
      if (next === null) break;
      bitrate = next;
    }
    throw new UserFacingError('動画を25MB以内に圧縮できませんでした。もっと短い動画を選んでください。');
  } finally {
    input.dispose();
  }
}

async function runConversion(
  input: Input,
  video: Parameters<typeof Conversion.init>[0]['video'],
  audio: ConversionAudioOptions | undefined,
  attempt: number,
): Promise<ArrayBuffer> {
  const target = new BufferTarget();
  const output = new Output({
    // moov をファイルの先頭に置く（再生開始までの待ちを減らす。サーバーもこれを要求する）。
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  });
  const conversion = await Conversion.init({
    input,
    output,
    tracks: 'primary',
    video,
    audio: audio ?? { discard: true },
    tags: {},
  });
  if (!conversion.isValid) {
    console.error('invalid conversion', conversion.discardedTracks);
    throw new UserFacingError('この端末ではこの動画を変換できません。別の動画を選んでください。');
  }
  conversion.onProgress = (p) => progress('compressing', p, attempt);
  await conversion.execute();
  if (!target.buffer) throw new Error('conversion produced no output');
  return target.buffer;
}

// verifyOutput は圧縮した動画を読み直し、投稿の条件（形式・長さ・解像度・fps・容量）を
// 満たすかを確かめる。サーバーも同じ検査をするので、通らないものはアップロードしない。
async function verifyOutput(buffer: ArrayBuffer): Promise<void> {
  progress('verifying', 0);
  const input = new Input({ source: new BlobSource(new Blob([buffer], { type: 'video/mp4' })), formats: ALL_FORMATS });
  try {
    const video = await input.getPrimaryVideoTrack();
    if (!video) throw new UserFacingError('圧縮した動画に映像がありません。');
    const audio = await input.getPrimaryAudioTrack();
    const stats = await video.computePacketStats();
    const check = checkOutput({
      sizeBytes: buffer.byteLength,
      durationSec: await input.computeDuration(),
      width: await video.getDisplayWidth(),
      height: await video.getDisplayHeight(),
      fps: stats.averagePacketRate,
      videoCodec: await video.getCodec(),
      audioCodec: audio ? await audio.getCodec() : null,
    });
    if (!check.ok) throw new UserFacingError(check.message);
    progress('verifying', 1);
  } finally {
    input.dispose();
  }
}

async function finish(
  buffer: ArrayBuffer,
  width: number,
  height: number,
  durationSec: number,
  hasAudio: boolean,
  passthrough: boolean,
  attempts: number,
): Promise<CompressResult> {
  progress('thumbnail', 0);
  const videoBlob = new Blob([buffer], { type: 'video/mp4' });
  const thumbnail = await makeThumbnail(videoBlob, durationSec);
  progress('thumbnail', 1);
  return { video: videoBlob, thumbnail, width, height, durationSec, hasAudio, passthrough, attempts };
}

// makeThumbnail は圧縮後の動画から1コマ切り出して JPEG にする。最初のコマは
// 黒いことが多いので、少し進めた位置（最大1秒）を使う。
async function makeThumbnail(videoBlob: Blob, durationSec: number): Promise<Blob> {
  const input = new Input({ source: new BlobSource(videoBlob), formats: ALL_FORMATS });
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new Error('no video track in the output');
    const { width, height } = thumbnailSize(track);
    const sink = new CanvasSink(track, { width, height, fit: 'contain' });
    const frame = (await sink.getCanvas(Math.min(1, durationSec / 4))) ?? (await sink.getCanvas(0));
    if (!frame) throw new Error('no frame for the thumbnail');
    const canvas = frame.canvas as OffscreenCanvas;
    for (const quality of [0.8, 0.6, 0.4]) {
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
      if (blob.size <= THUMBNAIL_MAX_BYTES) return blob;
    }
    throw new Error('thumbnail is too large');
  } finally {
    input.dispose();
  }
}

function thumbnailSize(track: InputVideoTrack): { width: number; height: number } {
  const w = track.displayWidth;
  const h = track.displayHeight;
  const scale = Math.min(1, THUMBNAIL_LONG_SIDE / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}
