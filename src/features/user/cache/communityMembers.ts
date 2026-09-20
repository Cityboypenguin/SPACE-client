import { mutate } from 'swr';

// コミュニティのメンバー一覧 (getCommunityMembers) の SWR キーと無効化を1か所にまとめる。
//
// 詳細パネル・メンバーモーダル・設定モーダルはどれも開くたびにマウントされるため、
// 素の useEffect で取りに行くと同じ問い合わせが毎回飛ぶ。共通キー + revalidateIfStale:false
// （staticCacheOptions）でキャッシュを効かせ、代わりにメンバーを変更した側から
// invalidateCommunityMembers() で明示的に捨てる。
export const communityMembersKey = (communityID: string, limit = 50, offset = 0) =>
  ['community-members', communityID, limit, offset] as const;

export const invalidateCommunityMembers = (communityID: string) =>
  mutate((key) => Array.isArray(key) && key[0] === 'community-members' && key[1] === communityID);
