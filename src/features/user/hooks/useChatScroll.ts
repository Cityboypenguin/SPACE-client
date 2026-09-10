import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { type Message } from '../api/message';

// スクロール制御のための可変値。描画には使わないが、ルームを切り替えたら必ず初期状態に
// 戻す必要がある（前のルームの「初回スクロール済み」や「既読件数」を引き継ぐと、
// 新しいルームで初期スクロールが走らない・未読バッジが誤った件数になる）。
type RoomScrollState = {
  /** そのルームでの初回スクロール（未読位置 or 最下部）を実行済みか */
  initialScrolled: boolean;
  /** 遅延ロードによる高さ変化への追従を終えたか */
  initialPhaseDone: boolean;
  /** 最下部を表示中か */
  atBottom: boolean;
  /** ユーザーが目にしたとみなせるメッセージ件数 */
  seenCount: number;
  /** 末尾メッセージ ID。プリペンド（過去の読み込み）とアペンド（新着）の区別に使う */
  lastTailId: string | undefined;
};

const createRoomScrollState = (): RoomScrollState => ({
  initialScrolled: false,
  initialPhaseDone: false,
  atBottom: false,
  seenCount: 0,
  lastTailId: undefined,
});

/** まだ読み込み中の画像が残っているか */
const hasPendingImages = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('img')).some((img) => !img.complete);

type UseChatScrollParams = {
  messages: Message[];
  /** メッセージ一覧のスクロールコンテナ。遅延ロードによる高さ変化の検知に使う */
  containerRef: RefObject<HTMLDivElement | null>;
  roomId?: string;
  /** 過去のメッセージを遡って閲覧中か（ページング中は自動スクロールを抑制する） */
  hasMoreAfter?: boolean;
};

// 自分の発言かどうかは Message.isMine が持つため、閲覧者の ID は受け取らない。
export const useChatScroll = ({ messages, containerRef, roomId, hasMoreAfter }: UseChatScrollParams) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);

  // ルームに紐づく可変状態は「どのルームのものか」ごと保持し、参照時に roomId のズレを見て
  // 作り直す。リセットをレンダー中の副作用ではなく参照時の遅延初期化にすることで、
  // 破棄されたレンダーでリセットだけが適用される事故が起きない。getRoomState() は
  // 常に effect / イベントハンドラの中から呼ぶこと（レンダー中に呼んではいけない）。
  const roomStateRef = useRef<{ roomId: string | undefined; state: RoomScrollState } | null>(null);
  // roomId が変わったときだけ関数の同一性が変わるため、これを依存に含めた effect は
  // ルーム切り替えで必ず再実行される。
  const getRoomState = useCallback((): RoomScrollState => {
    if (!roomStateRef.current || roomStateRef.current.roomId !== roomId) {
      roomStateRef.current = { roomId, state: createRoomScrollState() };
    }
    return roomStateRef.current.state;
  }, [roomId]);

  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // 表示に使う state のルーム切り替えリセット。レンダー中の setState は
  // 「props の変化に合わせて state を調整する」React 公式のパターンで、コミット前に
  // 再レンダーされるため、切り替え直後に前のルームのバッジが一瞬見えることがない。
  const [renderedRoomId, setRenderedRoomId] = useState(roomId);
  if (renderedRoomId !== roomId) {
    setRenderedRoomId(roomId);
    setNewMessageCount(0);
    setIsAtBottom(false);
  }

  // 未読があれば未読の先頭へ、なければ最下部へ寄せる
  const scrollToInitialPosition = useCallback(() => {
    if (firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  // 初回表示の位置決め。ここでは何も待たずに寄せ、そのあとの高さ変化には下の effect が
  // 追従する。待たないぶん、画像付きのルームでも表示が遅れない。
  useEffect(() => {
    const roomState = getRoomState();
    if (messages.length === 0 || roomState.initialScrolled) return;

    roomState.seenCount = messages.length;
    roomState.lastTailId = messages[messages.length - 1]?.ID;

    scrollToInitialPosition();
    roomState.initialScrolled = true;

    // 画像が最初から出揃っている（キャッシュ済み・画像なし）なら追従は不要
    const container = containerRef.current;
    if (!container || !hasPendingImages(container)) {
      roomState.initialPhaseDone = true;
    }
  }, [messages, containerRef, getRoomState, scrollToInitialPosition]);

  // 初回表示の直後は、画像などの遅延ロードで本文の高さが後から変わる。高さが確定するのを
  // 事前に待つ（＝ URL を先読みする）のではなく、実際にロードが完了するたびに目標位置へ
  // 貼り直す。読み込み順やキャッシュの状態に依存しないぶん確実で、寸法情報を持たない
  // 既存のメッセージにもそのまま効く。ユーザーが自分で操作した時点で追従をやめる。
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // load / error はバブルしないためキャプチャフェーズで拾う。
    // error も拾うのは、壊れた画像で追従が終わらなくなるのを防ぐため。
    const repin = () => {
      const roomState = getRoomState();
      if (!roomState.initialScrolled || roomState.initialPhaseDone) return;
      scrollToInitialPosition();
      if (!hasPendingImages(container)) {
        roomState.initialPhaseDone = true;
      }
    };

    // ユーザーの操作が入ったら、以降は勝手に位置を動かさない
    const release = () => {
      getRoomState().initialPhaseDone = true;
    };

    container.addEventListener('load', repin, true);
    container.addEventListener('error', repin, true);
    container.addEventListener('wheel', release, { passive: true });
    container.addEventListener('touchstart', release, { passive: true });
    container.addEventListener('keydown', release);

    return () => {
      container.removeEventListener('load', repin, true);
      container.removeEventListener('error', repin, true);
      container.removeEventListener('wheel', release);
      container.removeEventListener('touchstart', release);
      container.removeEventListener('keydown', release);
    };
  }, [containerRef, getRoomState, scrollToInitialPosition]);

  // 最下部の可視判定。初回スクロールが終わるまでは、途中経過の位置を
  // 「ユーザーが最下部を見ている」と誤認しないよう無視する。
  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const roomState = getRoomState();
        if (!roomState.initialScrolled) return;
        const atBottom = entry.isIntersecting;
        roomState.atBottom = atBottom;
        setIsAtBottom(atBottom);
        if (atBottom) {
          roomState.seenCount = messages.length;
          setNewMessageCount(0);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [messages.length, getRoomState]);

  // 末尾に新着が追加されたときのみ処理（プリペンドはスキップ）
  // - 歴史閲覧中（hasMoreAfter=true）はページング中のためスクロール抑制
  // - 一番下を見ているとき、または自分のメッセージなら自動スクロール
  // - それ以外は未読バッジをインクリメント
  useEffect(() => {
    const roomState = getRoomState();
    if (!roomState.initialScrolled || messages.length === 0) return;

    const tail = messages[messages.length - 1];
    if (!tail) return;

    // 末尾 ID が変わっていない = 上方向のプリペンドのみ → スクロール不要
    if (tail.ID === roomState.lastTailId) return;
    roomState.lastTailId = tail.ID;

    // 新着が来た時点で初回表示の追従は役目を終える。ここで降ろさないと、
    // 新着に合わせて動かした直後に初回分の画像がロードされたとき、
    // 追従が初期位置（未読の先頭）へ引き戻してしまう。
    roomState.initialPhaseDone = true;

    if (hasMoreAfter) {
      const unseen = messages.length - roomState.seenCount;
      setNewMessageCount(unseen > 0 ? unseen : 0);
      return;
    }

    if (roomState.atBottom || tail.isMine) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      roomState.seenCount = messages.length;
      setNewMessageCount(0);
    } else {
      const unseen = messages.length - roomState.seenCount;
      setNewMessageCount(unseen > 0 ? unseen : 0);
    }
  }, [messages, hasMoreAfter, getRoomState]);

  const scrollToLatest = useCallback(() => {
    // ユーザーの明示的な操作なので、初回の追従フェーズは終了させる
    const roomState = getRoomState();
    roomState.initialPhaseDone = true;
    roomState.seenCount = messages.length;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessageCount(0);
  }, [getRoomState, messages.length]);

  return {
    bottomRef,
    firstUnreadRef,
    newMessageCount,
    isAtBottom,
    scrollToLatest,
  };
};
