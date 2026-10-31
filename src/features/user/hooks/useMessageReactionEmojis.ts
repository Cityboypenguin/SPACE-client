import { useEffect, useState } from 'react';
import { getMessageReactionEmojis } from '../api/message';

// サーバーが許す絵文字の一覧は実行中に変わらないので、画面を開くたびに取り直さず、
// 最初の1回の結果を使い回す。取得に失敗したら次回また取りに行く（失敗を覚えない）。
let cached: Promise<string[]> | null = null;

const loadEmojis = (): Promise<string[]> => {
  if (!cached) {
    cached = getMessageReactionEmojis().catch((err) => {
      cached = null;
      throw err;
    });
  }
  return cached;
};

// 一覧が取れるまで（または取れなかったとき）は空配列を返す。空のあいだは
// リアクションを付けるボタンを出さないだけで、チャット自体は使える。
export const useMessageReactionEmojis = (enabled: boolean): string[] => {
  const [emojis, setEmojis] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    loadEmojis()
      .then((list) => { if (active) setEmojis(list); })
      .catch((err) => console.error('[useMessageReactionEmojis] failed to load emojis:', err));
    return () => { active = false; };
  }, [enabled]);

  return emojis;
};
