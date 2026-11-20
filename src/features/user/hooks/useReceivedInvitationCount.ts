import useSWR from 'swr';
import { useAuth } from '../context/useAuth';
import { receivedInvitations } from '../api/communityInvitations';
import { receivedInvitationCountKey } from '../lib/communityInvitationLinks';

// 届いている招待の件数。サイドバーのコミュニティのバッジと、コミュニティ一覧の
// 「届いた招待」ボタンで同じキャッシュを使う。
//
// サイドバーは画面を移るたびに作り直されるので、そのたびには取り直さない
// （revalidateIfStale: false）。招待が届く・取り消される・返事をしたときは
// サーバーからの通知で refreshInvitationCaches() がこのキーを取り直し、
// 取りこぼしはタブに戻ったときの再検証で拾う。
export const useReceivedInvitationCount = () => {
  const { userId } = useAuth();
  const { data, mutate } = useSWR(
    userId ? receivedInvitationCountKey(userId) : null,
    async () => (await receivedInvitations(0)).total,
    { revalidateIfStale: false, revalidateOnFocus: true },
  );
  return { count: data ?? 0, loaded: data !== undefined, refresh: mutate };
};
