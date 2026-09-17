import { type Message } from '../api/message';

/**
 * 同じ人が同じ分に続けて投稿したメッセージは、LINE と同じく1つのまとまりとして扱う。
 * まとまりの中では行間を詰め、アイコン・名前は先頭のメッセージにだけ、
 * 時刻は末尾のメッセージにだけ出す。
 *
 * 分の比較は UTC で行うが、画面に出るのは端末のローカル時刻。時差は分単位なので
 * 「UTC で同じ分」と「ローカルで同じ分」は必ず一致する。
 * 同じ分なら日付も同じなので、日付区切りがまとまりの中に割り込むこともない。
 */
const minuteKey = (createdAt: string) => new Date(createdAt).toISOString().slice(0, 16);

export const isSameMessageGroup = (
  a: Message | null | undefined,
  b: Message | null | undefined,
): boolean => {
  if (!a || !b) return false;
  // 授業チャットの匿名投稿者もルームごとに固定の user.ID を持つので、これで判定できる
  if (a.user.ID !== b.user.ID) return false;
  return minuteKey(a.createdAt) === minuteKey(b.createdAt);
};

/**
 * 未読区切り線を入れる位置。該当なしなら -1。
 * ルームを開いた時点の既読時刻をまたぐ、最初の「相手の」メッセージが対象。
 *
 * 位置を先に求めておくのは、区切り線を出すかどうかだけでなく
 * 「そこでメッセージのまとまりを切る」判断にも前後の要素で使うため。
 */
export const findFirstUnreadIndex = (
  messages: Message[],
  initialLastReadAtMs: number | null,
  isMine: (msg: Message) => boolean,
): number => {
  if (initialLastReadAtMs === null) return -1;
  return messages.findIndex((msg, index) => {
    if (isMine(msg)) return false;
    if (new Date(msg.createdAt).getTime() <= initialLastReadAtMs) return false;
    const prev = index > 0 ? messages[index - 1] : null;
    return prev === null || new Date(prev.createdAt).getTime() <= initialLastReadAtMs;
  });
};
