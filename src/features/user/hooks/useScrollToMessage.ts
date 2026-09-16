import { useEffect } from 'react';

// ハイライトを見せている時間。ジャンプ先が分かればよいので短めにする。
const HIGHLIGHT_DURATION_MS = 1600;

type Params = {
  containerRef: React.RefObject<HTMLElement | null>;
  // useRoomMessages がジャンプ先を読み込み終えたタイミングで入るメッセージID
  pendingScrollId: string | null;
  onScrolled: () => void;
  // messages の変化を待ってからスクロールするための依存値
  messageCount: number;
  // useChatScroll の初回スクロール追従を解除するコールバック。
  // これを呼ばないと画像ロードのたびに初期位置へ引き戻される。
  releaseAutoScroll: () => void;
};

// ハイライト色。CSS 変数で定義された実際の色を要素から読む（テーマ追従のため）。
// 変数が空（未定義）なら控えめな既定色にフォールバックする。
const highlightColor = (el: HTMLElement): string => {
  const value = getComputedStyle(el).getPropertyValue('--color-warning-bg').trim();
  return value !== '' ? value : 'rgba(255, 213, 79, 0.35)';
};

/**
 * 引用のタップや返信通知から指定メッセージへスクロールし、一時的にハイライトする。
 * 対象は data-message-id 属性で探すので、呼び出し側はメッセージ要素にそれを付ける。
 *
 * ハイライトを React の state + CSS アニメーションではなく Web Animations API で
 * かけているのは、同じメッセージを続けてタップしたときに必ず光らせるため。
 * クラスの付け外しでアニメーションを制御すると、2回目は「すでに同じクラスが付いている」
 * 状態になってアニメーションが再生されない。
 */
export const useScrollToMessage = ({ containerRef, pendingScrollId, onScrolled, messageCount, releaseAutoScroll }: Params) => {
  useEffect(() => {
    if (!pendingScrollId) return;
    const container = containerRef.current;
    if (!container) return;

    const target = container.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(pendingScrollId)}"]`);
    if (!target) {
      // メッセージが1件も無い＝まだ読み込み中。messageCount の更新で再試行する。
      // 逆に読み込み済みなのに見つからないなら対象は削除済みなので、要求を捨てる
      // （後のページングで別メッセージが増えたときに誤ってスクロールしないため）。
      if (messageCount > 0) onScrolled();
      return;
    }

    releaseAutoScroll();
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });

    const color = highlightColor(target);
    target.animate(
      [
        { backgroundColor: color },
        { backgroundColor: color, offset: 0.55 },
        { backgroundColor: 'transparent' },
      ],
      { duration: HIGHLIGHT_DURATION_MS, easing: 'ease-out' },
    );

    // ここで pendingScrollId が消えて effect は再実行されるが、アニメーションは
    // 要素側で再生され続けるので後始末（クリーンアップ）は不要。ルームを離れて
    // 要素ごと消える場合もアニメーションは一緒に破棄される。
    onScrolled();
  }, [pendingScrollId, messageCount, containerRef, onScrolled, releaseAutoScroll]);
};
