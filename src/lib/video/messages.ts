// 圧縮の Worker とのやり取りの形。

// 圧縮を始める前の確認（長さ・解像度・形式）は、進み具合ではなく 'checked' で終わりを知らせる。
// verifying は圧縮した後の確認（できあがった動画が投稿の条件を満たすか）。
export type CompressPhase = 'compressing' | 'verifying' | 'thumbnail';

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
  // checked は圧縮の前の確認が通ったこと。この後に圧縮が始まる。
  | { type: 'checked' }
  | { type: 'progress'; phase: CompressPhase; progress: number; attempt: number }
  | { type: 'done'; result: CompressResult }
  | { type: 'error'; message: string };
