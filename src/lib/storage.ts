const minioBase = import.meta.env.VITE_MINIO_PUBLIC_ENDPOINT ?? '';

export type UploadHeader = { readonly name: string; readonly value: string };

// 署名付きURLの応答。uploadUrl と headers を1つの値にしてあるのは、
// 片方だけ渡せる形にすると headers を付け忘れても型で捕まらないため。
// 忘れると Azure Blob は 400 (MissingRequiredHeader) を返し、本文は保存されない。
export type PresignedUpload = {
  readonly uploadUrl: string;
  readonly headers: readonly UploadHeader[];
};

// 署名付きURLへファイル本体を直接 PUT する。
//
// headers はサーバーが置き場に応じて返したもので、中身は解釈せずそのまま付ける
// （Azure Blob は x-ms-blob-type: BlockBlob が必須。S3 互換では空で返る）。
// どちらが必要かをここで判定すると、置き場が増えるたびにクライアントも
// 直すことになる。
export const putToStorage = async (
  presigned: PresignedUpload,
  body: Blob,
  contentType: string,
): Promise<Response> => {
  const headers: Record<string, string> = { 'Content-Type': contentType };
  for (const header of presigned.headers) headers[header.name] = header.value;

  return await fetch(storageUrl(presigned.uploadUrl) ?? presigned.uploadUrl, {
    method: 'PUT',
    headers,
    body,
  });
};

export function storageUrl(url: string): string;
export function storageUrl(url: string | null | undefined): string | null | undefined;
export function storageUrl(url: string | null | undefined): string | null | undefined {
  if (!url || !minioBase) return url;
  if (url.startsWith(minioBase)) {
    return url.slice(minioBase.length) || '/';
  }
  return url;
}
