import {
  getPresignedMediaUploadUrl,
  getPresignedMessageMediaUploadUrl,
  uploadFileToStorage,
  type MediaInput,
} from './message';
import { prepareImageForUpload } from '../../../lib/prepareImageForUpload';

// 署名付きURLを1つ取ってくる関数の形。投稿用と DM 用で置き場が違うので、
// どちらを使うかは呼び出し側が選ぶ。
type PresignFn = (contentType: string) => Promise<{
  uploadUrl: string;
  objectKey: string;
}>;

const uploadWith = async (files: File[], presign: PresignFn): Promise<MediaInput[] | undefined> => {
  if (files.length === 0) return undefined;

  return Promise.all(
    files.map(async (originalFile) => {
      // アップロード前に画像を圧縮し、あわせて寸法を測る（非対応形式はそのまま）。
      const { file, width, height } = await prepareImageForUpload(originalFile);
      const { uploadUrl, objectKey } = await presign(file.type);
      await uploadFileToStorage(uploadUrl, file);
      return { objectKey, contentType: file.type, width, height };
    }),
  );
};

// uploadMediaFiles は投稿・質問・回答の添付。公開の置き場に入る。
export const uploadMediaFiles = (files: File[]): Promise<MediaInput[] | undefined> =>
  uploadWith(files, async (contentType) => {
    const { presignedMediaUploadUrl } = await getPresignedMediaUploadUrl(contentType);
    return presignedMediaUploadUrl;
  });

// uploadMessageMediaFiles は DM の添付。非公開の置き場に入り、表示は
// 期限付きの署名付きURLで配られる。
//
// uploadMediaFiles と分けてあるのは、公開の置き場が匿名読み取りを許してあるため。
// DM の本文は暗号化して保存しているので、添付だけ URL を知る誰にでも見える
// のは扱いが噛み合わない。メッセージ送信の経路では必ずこちらを使うこと。
export const uploadMessageMediaFiles = (files: File[]): Promise<MediaInput[] | undefined> =>
  uploadWith(files, async (contentType) => {
    const { presignedMessageMediaUploadUrl } = await getPresignedMessageMediaUploadUrl(contentType);
    return presignedMessageMediaUploadUrl;
  });
