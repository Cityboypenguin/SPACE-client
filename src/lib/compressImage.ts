// 画像アップロード前にブラウザ側でリサイズ・再エンコードして容量を軽くする。
// GIF（アニメーション）や SVG（ベクター）は劣化・破損を避けるためそのまま返す。

const MAX_DIMENSION = 1600; // 長辺の最大ピクセル数
const QUALITY = 0.8; // 再エンコード品質
const COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// createImageBitmap ではなく <img> 要素経由で読み込む。
// createImageBitmap は Safari で Display P3（iPhone 写真の広色域）の
// ICC プロファイルを sRGB に色変換せず、彩度が過剰に見える不具合があるため。
// <img> 経由なら EXIF の回転も広色域の色変換もブラウザが正しく処理する。
const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (err) => reject(err));
    image.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));

export const compressImage = async (file: File): Promise<File> => {
  if (!COMPRESSIBLE_TYPES.has(file.type)) return file;

  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url).catch(() => null);
    if (!image) return file;

    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) return file;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    // WebP は透過を保持しつつ高圧縮。非対応環境では null になるため JPEG にフォールバック。
    const blob =
      (await canvasToBlob(canvas, 'image/webp')) ?? (await canvasToBlob(canvas, 'image/jpeg'));
    if (!blob) return file;

    // 圧縮しても軽くならない場合は元ファイルを使う。
    if (blob.size >= file.size) return file;

    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^./\\]+$/, '');
    return new File([blob], `${baseName}.${extension}`, { type: blob.type });
  } finally {
    URL.revokeObjectURL(url);
  }
};
