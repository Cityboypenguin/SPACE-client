import { request } from '../../../lib/graphql';
import { ADMIN_TOKEN_KEY } from './auth';
import { putToStorage } from '../../../lib/storage';
import { STAMP_FIELDS } from '../../user/hooks/useChatStamps';
import type { ReactionStamp } from '../../user/constants/reactionStamps';
export type { ReactionStamp as ChatStamp };
export type StampInput = Omit<ReactionStamp, 'imageUrl' | 'id'> & {
  id?: string;
  uploadKey?: string;
};
const token = () => localStorage.getItem(ADMIN_TOKEN_KEY) ?? undefined;
export const listChatStamps = async () =>
  (
    await request<{ adminChatStamps: ReactionStamp[] }>(
      `query { adminChatStamps { ${STAMP_FIELDS} } }`,
      {},
      token(),
    )
  ).adminChatStamps;
export const saveChatStamp = async (input: StampInput) =>
  (
    await request<{ adminSaveChatStamp: ReactionStamp }>(
      `mutation($input:ChatStampInput!){adminSaveChatStamp(input:$input){${STAMP_FIELDS}}}`,
      { input },
      token(),
    )
  ).adminSaveChatStamp;
export const reorderChatStamps = async (
  items: ReactionStamp[],
  reaction: boolean,
) =>
  request(
    `mutation($items:[ChatStampOrderInput!]!,$reaction:Boolean!){adminReorderChatStamps(items:$items,reaction:$reaction)}`,
    { items: items.map((s) => ({ id: s.id, version: s.version })), reaction },
    token(),
  );
export const uploadStampImage = async (file: File) => {
  const contentType = file.name.toLowerCase().endsWith('.svg')
    ? 'image/svg+xml'
    : 'image/png';
  if (!/\.(png|svg)$/i.test(file.name) || file.size > 20 * 1024 * 1024)
    throw new Error('PNG／SVG、20MiB以下の画像を選んでください');
  const data = await request<{
    adminStampUploadUrl: {
      uploadUrl: string;
      objectKey: string;
      headers: { name: string; value: string }[];
    };
  }>(
    `query($type:String!){adminStampUploadUrl(contentType:$type){uploadUrl objectKey headers{name value}}}`,
    { type: contentType },
    token(),
  );
  const res = await putToStorage(data.adminStampUploadUrl, file, contentType);
  if (!res.ok) throw new Error('画像のアップロードに失敗しました');
  return data.adminStampUploadUrl.objectKey;
};
