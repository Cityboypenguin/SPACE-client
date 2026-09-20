import { useEffect, useRef } from 'react';

// サーバの room_changed（旧 unread_room）が運ぶ「このルームが更新された」という事実。
//
// 未読数（unreadCount）は載らない。以前はサーバが送信のたびに全メンバー・全履修者ぶんの
// 未読数を集計して配っていたが、受け取ったこちらはどのみち自分の未読数を取り直していた。
// サーバは事実だけを配り、未読数は必要になった画面が自分ぶんだけ取得する。
//
// 投稿者は配信対象から外れているので、受け取った時点で必ず「自分以外の更新」。
// actorID は載らない（授業内チャットは匿名で、投稿者を特定できる情報を配れないため）。
export type RoomChangedEvent = {
  roomID: string;
  // 新着メッセージのID。既読による更新（hasNewMessage: false）では載らない。
  // 新旧の判定には使わない（isStale 参照）。同じメッセージのイベントを2度処理しない、
  // といった用途のために残してある。
  messageID?: string;
  // 新着メッセージによる更新なら true。既読による更新なら false
  // （＝一覧のプレビューを書き換えてはいけない）。
  hasNewMessage: boolean;
  // 新着メッセージのプレビュー（50文字省略・画像のみの代替文言はサーバ側で作られる）。
  lastMessage?: string;
  // サーバがこのイベントを組み立てた時刻（Unix エポックからのナノ秒の10進文字列）。
  // 新着による更新にだけ載る。順番が入れ替わって届いた古いイベントを捨てるために使う
  // （isStale 参照）。数値ではなく文字列なのは、ナノ秒（現在およそ 1.7e18）が
  // Number の安全な整数（9.0e15）を超え、数値で受けると下位の桁が丸めて落ちるため。
  sentAt?: string;
};

type Listener = (event: RoomChangedEvent) => void;

const listeners = new Set<Listener>();

// ルームごとに「最後に処理した新着イベントの sentAt」。順番が入れ替わって届いた
// 古いイベントを捨てるために使う（isStale 参照）。
const lastSeenSentAt = new Map<string, bigint>();

/**
 * sentAt を比較できる値へ直す。読めなければ null。
 *
 * ナノ秒は Number では表せない桁数なので BigInt で持つ（Number にすると、同じ
 * ミリ秒に並んだ2件を分ける下位の桁がまさに落ちる）。BigInt() は不正な文字列で
 * 例外を投げるため、先に数字だけであることを確かめてから渡す。
 */
const parseSentAt = (sentAt: string): bigint | null =>
  /^\d+$/.test(sentAt) ? BigInt(sentAt) : null;

/**
 * 順番が入れ替わって届いた古いイベントかどうか。
 *
 * サーバは room_changed を順序を保証せずに配信する（配信を待たせないため。詳細は
 * サーバの usecase/chat/async_events.go）。入れ替わったまま適用すると、一覧の
 * プレビューが古いメッセージへ巻き戻る。だから受け取ったこちらで新旧を判定する。
 *
 * 判定にはサーバが載せた sentAt（イベントを組み立てた時刻）を使う。messageID の
 * 中身は見ない: あれは不透明IDで、中の連番を解けば比較はできるものの、解いた時点で
 * 「クライアントはIDの中身を解釈しない」という約束が壊れ、サーバが符号化を変えた日に
 * ビルドも lint も通ったまま順序判定だけが黙って退化する。
 *
 * 同値は「古い」として捨てる。同じ sentAt が2度来るのはまず同じイベントの二重配信で、
 * 捨てれば二重処理を防げる。時計の分解能が粗くて別々の新着が同値になった場合は
 * プレビューの更新が1回落ちるが、未読数はデバウンス後の取り直しで正しくなり、
 * 本文も次の一覧取得で追いつくので実害は小さい。逆に同値を通す側へ倒すと、
 * 二重配信のたびにプレビューが書き換わる。
 *
 * sentAt が無い／読めないイベントは捨てずに通す。判定できないときに捨てると更新が
 * 永久に届かなくなるが、通した場合の最悪はプレビューが一瞬古くなることだけで、
 * これも次の取り直しで直る（安全側は「通す」）。
 */
const isStale = (event: RoomChangedEvent): boolean => {
  // 既読による更新はプレビューを触らないので新旧の判定が要らない（サーバも
  // このイベントには sentAt を載せない）。未読数はどのみち取り直す。
  if (!event.hasNewMessage) return false;
  if (event.sentAt === undefined) return false;

  const incoming = parseSentAt(event.sentAt);
  if (incoming === null) return false;

  const previous = lastSeenSentAt.get(event.roomID);
  if (previous !== undefined && incoming <= previous) return true;

  lastSeenSentAt.set(event.roomID, incoming);
  return false;
};

// NotificationContext の SSE 接続（room_changed イベント）から呼ばれる
export const emitRoomChanged = (event: RoomChangedEvent) => {
  if (isStale(event)) return;
  for (const listener of listeners) listener(event);
};

export const useUnreadSubscription = (onUpdate: Listener) => {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const listener: Listener = (event) => onUpdateRef.current(event);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
};
