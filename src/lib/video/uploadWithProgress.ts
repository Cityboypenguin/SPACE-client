import { storageUrl, type PresignedUpload } from '../storage';

export class UploadCanceledError extends Error {
  constructor() {
    super('canceled');
  }
}

// uploadWithProgress は署名付きURLへ PUT し、進み具合を返す。
//
// fetch ではアップロードの進み具合が取れない（ブラウザーによっては取れても限定的）ので
// XMLHttpRequest を使う。signal で中止できる。ヘッダーは putToStorage と同じく、
// サーバーが返したものを解釈せずにそのまま付ける（Azure は x-ms-blob-type が必須）。
export const uploadWithProgress = (
  presigned: PresignedUpload,
  body: Blob,
  contentType: string,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadCanceledError());
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', storageUrl(presigned.uploadUrl) ?? presigned.uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    for (const header of presigned.headers) xhr.setRequestHeader(header.name, header.value);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve();
      } else {
        reject(new Error('動画のアップロードに失敗しました。通信環境を確認してもう一度お試しください。'));
      }
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error('動画のアップロードに失敗しました。通信環境を確認してもう一度お試しください。'));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new UploadCanceledError());
    };
    xhr.send(body);
  });
