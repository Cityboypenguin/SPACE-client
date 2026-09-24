import { mutate } from 'swr';
import type { CommunityMember } from '../api/community';

type CommunityMemberListCacheData = {
  members: CommunityMember[];
  total: number;
  cachedAt: number;
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const memberListCaches = new Map<string, CommunityMemberListCacheData>();

// コミュニティのメンバー一覧のキャッシュと無効化を1か所にまとめる。
//
// 詳細パネルの無限スクロール結果は TTL 付きで保持し、SWR を使う編集画面・モーダルは
// 共通キーで保持する。メンバー変更時は両方を invalidateCommunityMembers() で捨てる。
export const communityMembersKey = (communityID: string, limit = 50, offset = 0) =>
  ['community-members', communityID, limit, offset] as const;

export const getCommunityMemberListCache = (communityID: string): CommunityMemberListCacheData | null => {
  const data = memberListCaches.get(communityID);
  if (!data) return null;
  if (Date.now() - data.cachedAt > CACHE_TTL_MS) {
    memberListCaches.delete(communityID);
    return null;
  }
  return data;
};

export const saveCommunityMemberListCache = (
  communityID: string,
  data: Omit<CommunityMemberListCacheData, 'cachedAt'>,
) => {
  memberListCaches.set(communityID, { ...data, cachedAt: Date.now() });
};

export const invalidateCommunityMembers = (communityID: string) => {
  memberListCaches.delete(communityID);
  return mutate((key) => Array.isArray(key) && key[0] === 'community-members' && key[1] === communityID);
};
