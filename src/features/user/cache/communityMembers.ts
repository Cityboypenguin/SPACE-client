import { mutate } from 'swr';
import { unstable_serialize } from 'swr/infinite';

// コミュニティのメンバー一覧のキャッシュ（SWR）。キーと無効化を1か所にまとめる。
//
// 表示は SWR の stale-while-revalidate に任せる: 前回の一覧を即座に出しつつ、
// 画面を開いたとき・タブに戻ったときに裏で取り直す。他の人の参加・退出は
// この端末の操作では起きないので、参加案内の受信など「変わった」と分かった時点で
// invalidateCommunityMembers() を呼んで、開いている一覧もその場で取り直させる。
export const communityMembersKey = (communityID: string, limit = 50, offset = 0) =>
  ['community-members', communityID, limit, offset] as const;

// 詳細パネルの無限スクロール（useSWRInfinite）のページキー。
export const COMMUNITY_MEMBER_PANEL_PAGE_SIZE = 10;
export const communityMemberPanelKey = (communityID: string) =>
  (index: number, previous: { items: unknown[] } | null) => {
    if (previous && previous.items.length < COMMUNITY_MEMBER_PANEL_PAGE_SIZE) return null;
    return communityMembersKey(communityID, COMMUNITY_MEMBER_PANEL_PAGE_SIZE, index * COMMUNITY_MEMBER_PANEL_PAGE_SIZE);
  };

export const invalidateCommunityMembers = (communityID: string) =>
  Promise.all([
    // 編集画面・モーダル（useSWR）のページ。
    mutate((key) => Array.isArray(key) && key[0] === 'community-members' && key[1] === communityID),
    // フィルター指定の mutate は useSWRInfinite 本体のキーを飛ばすので、名指しで取り直す。
    mutate(unstable_serialize(communityMemberPanelKey(communityID))),
  ]);
