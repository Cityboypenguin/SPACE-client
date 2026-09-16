// 返信通知（message_reply）の遷移先パスを組み立てる。
//
// ルームごとにチャット画面のパスが違い、さらに「どのメッセージへジャンプするか」を
// ?messageID= で渡す必要があるため、通知一覧・通知詳細・SSEトーストの3箇所で
// 同じ組み立てを使えるようにここへ切り出している。

export const MESSAGE_REPLY_TYPE = 'message_reply';

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
