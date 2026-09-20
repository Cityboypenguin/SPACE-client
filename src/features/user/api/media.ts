import {
  getPresignedMediaUploadUrl,
  uploadFileToStorage,
  type MediaInput,
} from './message';
import { prepareImageForUpload } from '../../../lib/prepareImageForUpload';

export const uploadMediaFiles = async (files: File[]): Promise<MediaInput[] | undefined> => {
  if (files.length === 0) return undefined;

  return Promise.all(
    files.map(async (originalFile) => {
      // アップロード前に画像を圧縮し、あわせて寸法を測る（非対応形式はそのまま）。
      const { file, width, height } = await prepareImageForUpload(originalFile);
      const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(file.type);
      await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, file);
      return {
        objectKey: presignedMediaUploadUrl.objectKey,
        contentType: file.type,
        width,
        height,
      };
    }),
  );
};
