import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';
import { getUserToken } from './auth';
import { putToStorage } from '../../../lib/storage';
import { uploadWithProgress } from '../../../lib/video/uploadWithProgress';
import type { CompressResult } from '../../../lib/video/messages';
import type { VideoInput } from '../../../lib/video/fields';

const PresignedVideoUploadDocument = graphql(`
  query PresignedVideoUploadUrl {
    presignedVideoUploadUrl {
      uploadUrl
      objectKey
      headers {
        name
        value
      }
    }
    presignedVideoThumbnailUploadUrl {
      uploadUrl
      objectKey
      headers {
        name
        value
      }
    }
  }
`);

const RequestVideoPlaybackDocument = graphql(`
  mutation RequestVideoPlayback($videoID: ID!) {
    requestVideoPlayback(videoID: $videoID) {
      url
      expiresAt
    }
  }
`);

const VideoSettingsDocument = graphql(`
  query VideoSettings {
    videoSettings {
      retentionDays
      maxFileBytes
      maxDurationSeconds
    }
  }
`);

export type PublicVideoSettings = {
  retentionDays: number;
  maxFileBytes: number;
  maxDurationSeconds: number;
};

let settingsCache: Promise<PublicVideoSettings> | null = null;

// getVideoSettings は投稿画面に出す保存期間など。画面ごとに何度も聞かないよう覚えておく。
export const getVideoSettings = (): Promise<PublicVideoSettings> => {
  if (!settingsCache) {
    settingsCache = requestDoc(VideoSettingsDocument, {}, getUserToken())
      .then((d) => d.videoSettings as PublicVideoSettings)
      .catch((err) => {
        settingsCache = null;
        throw err;
      });
  }
  return settingsCache;
};

export const requestVideoPlayback = async (videoID: string): Promise<{ url: string; expiresAt: string }> => {
  const data = await requestDoc(RequestVideoPlaybackDocument, { videoID }, getUserToken());
  return data.requestVideoPlayback;
};

// uploadCompressedVideo は圧縮済みの動画とサムネイルを置き場へ上げ、投稿・送信に渡すキーを返す。
// signal で中止できる。中止・失敗した場合、置いたファイルは staging に残るが、どこからも
// 参照されず、Azure のライフサイクル管理（staging は1日で削除）で消える。
export const uploadCompressedVideo = async (
  result: CompressResult,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<VideoInput> => {
  const data = await requestDoc(PresignedVideoUploadDocument, {}, getUserToken());
  const videoUrl = data.presignedVideoUploadUrl;
  const thumbUrl = data.presignedVideoThumbnailUploadUrl;
  // サムネイルは小さいので先に済ませ、進み具合は動画の分だけ出す。
  const thumbRes = await putToStorage(thumbUrl, result.thumbnail, 'image/jpeg');
  if (!thumbRes.ok) throw new Error('動画のアップロードに失敗しました。通信環境を確認してもう一度お試しください。');
  await uploadWithProgress(videoUrl, result.video, 'video/mp4', onProgress, signal);
  return { objectKey: videoUrl.objectKey, thumbnailObjectKey: thumbUrl.objectKey };
};
