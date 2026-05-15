const minioBase = import.meta.env.VITE_MINIO_PUBLIC_ENDPOINT ?? '';

export function storageUrl(url: string): string;
export function storageUrl(url: string | null | undefined): string | null | undefined;
export function storageUrl(url: string | null | undefined): string | null | undefined {
  if (!url || !minioBase) return url;
  if (url.startsWith(minioBase)) {
    return url.slice(minioBase.length) || '/';
  }
  return url;
}
