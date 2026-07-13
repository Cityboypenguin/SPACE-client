// 画像アップロード前にブラウザ側でリサイズ・再エンコードして容量を軽くする。
// GIF（アニメーション）や SVG（ベクター）は劣化・破損を避けるためそのまま返す。

const MAX_DIMENSION = 1600; // 長辺の最大ピクセル数
const QUALITY = 0.8; // 再エンコード品質
const COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const loadBitmap = async (file: File): Promise<ImageBitmap | null> => {
  try {
    // EXIF の回転情報を反映させる（スマホ写真の向き対策）。
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));

export const compressImage = async (file: File): Promise<File> => {
  if (!COMPRESSIBLE_TYPES.has(file.type)) return file;

  const bitmap = await loadBitmap(file);
  if (!bitmap) return file;

  try {
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    // WebP は透過を保持しつつ高圧縮。非対応環境では null になるため JPEG にフォールバック。
    const outputType = 'image/webp';
    const blob =
      (await canvasToBlob(canvas, outputType)) ?? (await canvasToBlob(canvas, 'image/jpeg'));
    if (!blob) return file;

    // 圧縮しても軽くならない場合は元ファイルを使う。
    if (blob.size >= file.size) return file;

    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^./\\]+$/, '');
    return new File([blob], `${baseName}.${extension}`, { type: blob.type });
  } finally {
    bitmap.close();
  }
};
