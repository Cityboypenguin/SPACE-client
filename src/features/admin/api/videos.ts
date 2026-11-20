import { requestDoc } from '../../../lib/graphql';
import { graphql } from '../../../generated';

const SETTINGS_FIELDS = graphql(`
  fragment AdminVideoSettingsFields on VideoSettings {
    retentionDays
    purgeGraceDays
    purgeBatchSize
    dailyUploadLimitPerUser
    dailyBytesLimitPerUser
    totalBytesLimit
    maxRetentionDays
    lifecycleBackstopDays
    maxFileBytes
    maxDurationSeconds
  }
`);

const DAILY_FIELDS = graphql(`
  fragment AdminVideoDailyFields on VideoDailyStat {
    day
    uploads
    uploadBytes
    uploadFailures
    playbackRequests
    playbackBytes
    purged
    purgeFailures
  }
`);

const PREVIEW_FIELDS = graphql(`
  fragment AdminVideoRetentionPreviewFields on VideoRetentionPreview {
    currentDays
    newDays
    maxDays
    newlyExpired { count bytes }
    expiringWithinWeek { count bytes }
  }
`);

// フラグメントは codegen がドキュメントとして拾うために定義している（JS 上は未使用）。
void SETTINGS_FIELDS;
void DAILY_FIELDS;
void PREVIEW_FIELDS;

const StatsDocument = graphql(`
  query AdminVideoStorageStats {
    adminVideoStorageStats {
      settings { ...AdminVideoSettingsFields }
      stored { count bytes }
      purgeFailing
      today { ...AdminVideoDailyFields }
      thisMonth { ...AdminVideoDailyFields }
      daily { ...AdminVideoDailyFields }
    }
  }
`);

const PreviewDocument = graphql(`
  query AdminPreviewVideoRetention($days: Int!) {
    adminPreviewVideoRetention(days: $days) { ...AdminVideoRetentionPreviewFields }
  }
`);

const UpdateRetentionDocument = graphql(`
  mutation AdminUpdateVideoRetention($days: Int!, $expected: Int!) {
    adminUpdateVideoRetention(days: $days, expectedNewlyExpiredCount: $expected) { ...AdminVideoRetentionPreviewFields }
  }
`);

const UpdateLimitsDocument = graphql(`
  mutation AdminUpdateVideoLimits($input: VideoLimitsInput!) {
    adminUpdateVideoLimits(input: $input) { ...AdminVideoSettingsFields }
  }
`);

const RemoveVideoDocument = graphql(`
  mutation AdminRemoveVideo($videoID: ID!) {
    adminRemoveVideo(videoID: $videoID)
  }
`);

export type VideoUsage = { count: number; bytes: number };

export type VideoDailyStat = {
  day: string;
  uploads: number;
  uploadBytes: number;
  uploadFailures: number;
  playbackRequests: number;
  playbackBytes: number;
  purged: number;
  purgeFailures: number;
};

export type AdminVideoSettings = {
  retentionDays: number;
  purgeGraceDays: number;
  purgeBatchSize: number;
  dailyUploadLimitPerUser: number;
  dailyBytesLimitPerUser: number;
  totalBytesLimit: number;
  maxRetentionDays: number;
  lifecycleBackstopDays: number;
  maxFileBytes: number;
  maxDurationSeconds: number;
};

export type AdminVideoStats = {
  settings: AdminVideoSettings;
  stored: VideoUsage;
  purgeFailing: number;
  today: VideoDailyStat;
  thisMonth: VideoDailyStat;
  daily: VideoDailyStat[];
};

export type RetentionPreview = {
  currentDays: number;
  newDays: number;
  maxDays: number;
  newlyExpired: VideoUsage;
  expiringWithinWeek: VideoUsage;
};

export type VideoLimitsInput = {
  purgeGraceDays: number;
  purgeBatchSize: number;
  dailyUploadLimitPerUser: number;
  dailyBytesLimitPerUser: number;
  totalBytesLimit: number;
};

export const getVideoStats = async (token: string): Promise<AdminVideoStats> => {
  const data = await requestDoc(StatsDocument, {}, token);
  return data.adminVideoStorageStats as AdminVideoStats;
};

export const previewVideoRetention = async (days: number, token: string): Promise<RetentionPreview> => {
  const data = await requestDoc(PreviewDocument, { days }, token);
  return data.adminPreviewVideoRetention as RetentionPreview;
};

export const updateVideoRetention = async (days: number, expected: number, token: string): Promise<RetentionPreview> => {
  const data = await requestDoc(UpdateRetentionDocument, { days, expected }, token);
  return data.adminUpdateVideoRetention as RetentionPreview;
};

export const updateVideoLimits = async (input: VideoLimitsInput, token: string): Promise<AdminVideoSettings> => {
  const data = await requestDoc(UpdateLimitsDocument, { input }, token);
  return data.adminUpdateVideoLimits as AdminVideoSettings;
};

export const removeVideo = async (videoID: string, token: string): Promise<boolean> => {
  const data = await requestDoc(RemoveVideoDocument, { videoID }, token);
  return data.adminRemoveVideo;
};
