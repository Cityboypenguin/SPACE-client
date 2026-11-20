// 圧縮の Worker とのやり取りの形。

export type CompressPhase = 'analyzing' | 'compressing' | 'thumbnail';

export type CompressRequest = { type: 'start'; file: File };

export type CompressResult = {
  video: Blob;
  thumbnail: Blob;
  width: number;
  height: number;
  durationSec: number;
  hasAudio: boolean;
  // 端末で圧縮できず、規格内の元動画をそのまま（moov を先頭へ移して）送るとき true。
  passthrough: boolean;
  attempts: number;
};

export type CompressResponse =
  | { type: 'progress'; phase: CompressPhase; progress: number; attempt: number }
  | { type: 'done'; result: CompressResult }
  | { type: 'error'; message: string };
