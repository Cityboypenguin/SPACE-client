import { ACCEPTED_VIDEO_TYPES, VIDEO_MAX_SOURCE_BYTES } from './constants';
import type { CompressPhase, CompressResponse, CompressResult } from './messages';

export type { CompressPhase, CompressResult };

export type CompressProgress = { phase: CompressPhase; progress: number; attempt: number };

export type CompressJob = {
  promise: Promise<CompressResult>;
  // cancel は圧縮を止め、Worker ごとメモリを解放する。promise は CompressCanceledError で終わる。
  cancel: () => void;
};

export class CompressCanceledError extends Error {
  constructor() {
    super('canceled');
  }
}

// precheckVideoFile は Worker を起こす前に分かる理由で断る（形式・大きさ）。
// 中身（長さ・解像度・コーデック）は Worker が読んで確かめる。
export const precheckVideoFile = (file: File): string | null => {
  // 端末によっては type が空になる（拡張子で判定できない）。その場合は中身の検査に任せる。
  if (file.type && !ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return 'この形式の動画には対応していません。MP4 または MOV の動画を選んでください。';
  }
  if (file.size > VIDEO_MAX_SOURCE_BYTES) {
    return `圧縮前の動画は${Math.round(VIDEO_MAX_SOURCE_BYTES / 1024 / 1024)}MBまでです。もっと短い動画を選んでください。`;
  }
  if (file.size === 0) return 'ファイルが空です。';
  return null;
};

// isVideoCompressionSupported は Worker と WebCodecs が無い環境（かなり古いブラウザー）を見分ける。
// WebCodecs が無くても、規格内の MP4 ならそのまま送れるので、ここは Worker の有無だけ見る。
export const isVideoCompressionSupported = (): boolean => typeof Worker !== 'undefined';

// compressVideo は Worker で圧縮を始める。
export const compressVideo = (file: File, onProgress: (p: CompressProgress) => void): CompressJob => {
  const worker = new Worker(new URL('./compress.worker.ts', import.meta.url), { type: 'module' });
  let settle: { resolve: (r: CompressResult) => void; reject: (e: unknown) => void } | null = null;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    worker.terminate();
  };

  const promise = new Promise<CompressResult>((resolve, reject) => {
    settle = { resolve, reject };
    worker.onmessage = (e: MessageEvent<CompressResponse>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        onProgress({ phase: msg.phase, progress: msg.progress, attempt: msg.attempt });
      } else if (msg.type === 'done') {
        finish();
        resolve(msg.result);
      } else {
        finish();
        reject(new Error(msg.message));
      }
    };
    worker.onerror = (e) => {
      finish();
      console.error('video worker crashed', e);
      reject(new Error('動画を圧縮できませんでした。端末のメモリが足りない可能性があります。'));
    };
    worker.postMessage({ type: 'start', file });
  });

  return {
    promise,
    cancel: () => {
      if (finished) return;
      finish();
      settle?.reject(new CompressCanceledError());
    },
  };
};
