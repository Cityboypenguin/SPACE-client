import {
  getPresignedMediaUploadUrl,
  uploadFileToStorage,
  type MediaInput,
} from './message';
import { compressImage } from '../../../lib/compressImage';

export const uploadMediaFiles = async (files: File[]): Promise<MediaInput[] | undefined> => {
  if (files.length === 0) return undefined;

  return Promise.all(
    files.map(async (originalFile) => {
      // アップロード前に画像を圧縮して容量を軽くする（非対応形式はそのまま）。
      const file = await compressImage(originalFile);
      const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(file.type);
      await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, file);
      return {
        objectKey: presignedMediaUploadUrl.objectKey,
        contentType: file.type,
      };
    }),
  );
};
