import { graphql } from '../../generated';

// 投稿・メッセージに付いた動画の形。投稿・チャット・管理画面で共通なので、型と
// 選択セットをここに集約する（lib/media.ts と同じ方針）。

export type VideoStatus = 'AVAILABLE' | 'EXPIRED' | 'REMOVED';

export type Video = {
  ID: string;
  status: VideoStatus;
  // 再生できる状態のときだけ入る（期限付きの署名付きURL）。
  thumbnailUrl?: string | null;
  durationMs: number;
  width: number;
  height: number;
  sizeBytes: number;
  hasAudio: boolean;
  expiresAt: string;
  retentionDays: number;
};

export const VideoFieldsFragment = graphql(`
  fragment VideoFields on Video {
    ID
    status
    thumbnailUrl
    durationMs
    width
    height
    sizeBytes
    hasAudio
    expiresAt
    retentionDays
  }
`);

// codegen を通さない生のクエリ文字列（サブスクリプション）用。MEDIA_FIELDS_RAW と同じく
// フラグメントの AST から導いて、手作業の同期をなくす。
const videoFieldNames = VideoFieldsFragment.definitions.flatMap((definition) => {
  if (definition.kind !== 'FragmentDefinition') return [];
  return definition.selectionSet.selections.map((selection) => {
    if (selection.kind !== 'Field' || selection.selectionSet) {
      throw new Error('VideoFields フラグメントは平坦なフィールドのみで構成してください');
    }
    return selection.name.value;
  });
});

/** 生のクエリ文字列に `video {${VIDEO_FIELDS_RAW}}` の形で埋め込む。 */
export const VIDEO_FIELDS_RAW = `\n    ${videoFieldNames.join('\n    ')}\n  `;

export type VideoInput = {
  objectKey: string;
  thumbnailObjectKey: string;
};

// expiredMessage は期限切れの動画の位置に出す文言。日数はサーバーの設定に従う。
export const expiredMessage = (retentionDays: number) =>
  `動画の保存期間（${retentionDays}日間）が終了しました。`;
