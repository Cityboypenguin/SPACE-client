// 通知タイプの定数と、通知から飛ぶ先のパス組み立て。
//
// ルームごとにチャット画面のパスが違い、さらに「どのメッセージへジャンプするか」を
// ?messageID= で渡す必要があるため、通知一覧・通知詳細・SSEトーストの3箇所で
// 同じ組み立てを使えるようにここへ切り出している。

export const MESSAGE_REPLY_TYPE = 'message_reply';
// 投稿本文での @accountID メンション。遷移先は投稿なのでこのリンク組み立ては使わない。
export const MENTION_TYPE = 'mention';
// コミュニティチャットでの @表示名 メンション。返信通知と同じくメッセージへジャンプする。
export const MESSAGE_MENTION_TYPE = 'message_mention';

// 通知詳細を挟まず、ルームを開いて該当メッセージまでジャンプするタイプ。
const MESSAGE_JUMP_TYPES: ReadonlySet<string> = new Set([MESSAGE_REPLY_TYPE, MESSAGE_MENTION_TYPE]);

export const isMessageJumpNotification = (type: string | null | undefined): boolean =>
  type != null && MESSAGE_JUMP_TYPES.has(type);

const ROOM_PATH: Record<string, (roomID: string) => string> = {
  community: (roomID) => `/community/chat/${roomID}`,
  course: (roomID) => `/courses/chat/${roomID}`,
  dm: (roomID) => `/dm/${roomID}`,
};

// roomType が未知（サーバー側でルーム種別が増えた等）の場合は null を返し、
// 呼び出し側は通知詳細へのフォールバックに任せる。
export const replyNotificationLink = (
  roomType: string | null | undefined,
  roomID: string | null | undefined,
  messageID: string | null | undefined,
): string | null => {
  if (!roomType || !roomID || !messageID) return null;
  const builder = ROOM_PATH[roomType];
  if (!builder) return null;
  return `${builder(roomID)}?messageID=${encodeURIComponent(messageID)}`;
};
