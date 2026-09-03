// 投稿本文からハッシュタグを抽出する。
// ルールはサーバー (usecase/post/hashtag.go) / 表示 (renderTextWithLinks) と揃える:
//   - マーカーは "#"（直後に空白なし）。
//   - マーカーは本文先頭、または直前が空白（\s は全角スペース U+3000 も含む）のときのみ有効。
//   - タグ本体はマーカー直後から最初の空白まで。
//   - 出現順を保ちつつ重複を除去する。
const HASHTAG_SCAN_REGEX = /#[^\s]+/g;
const WHITESPACE_REGEX = /\s/;

export function extractHashtags(text: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();

  HASHTAG_SCAN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HASHTAG_SCAN_REGEX.exec(text)) !== null) {
    const start = match.index;
    if (!(start === 0 || WHITESPACE_REGEX.test(text[start - 1]))) {
      continue;
    }
    const tag = match[0].slice(1);
    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }
  return tags;
}
