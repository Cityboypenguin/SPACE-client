import {
  getPresignedMediaUploadUrl,
  uploadFileToStorage,
  type MediaInput,
} from './message';

export const uploadMediaFiles = async (files: File[]): Promise<MediaInput[] | undefined> => {
  if (files.length === 0) return undefined;

  return Promise.all(
    files.map(async (file) => {
      const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(file.type);
      await uploadFileToStorage(presignedMediaUploadUrl.uploadUrl, file);
      return {
        objectKey: presignedMediaUploadUrl.objectKey,
        contentType: file.type,
      };
    }),
  );
};
