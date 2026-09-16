// メンションの記法まわりを1か所に集めたモジュール。
// 入力中のサジェスト判定（PostComposer / ChatInput）と表示側（renderTextWithLinks）が
// 同じルールを使うようにするため、走査は必ずここを経由する。
//
// 記法（サーバーの usecase/post/mention.go・usecase/message/mention.go と揃えている）:
//   - マーカーは "@" または全角 "＠"（日本語入力だと全角になりやすいため両方受ける）。
//   - マーカーは本文先頭、または直前が空白（\s は全角スペース U+3000 も含む）のときのみ有効。
//     ("mail@example.com" は直前が空白でないため反応しない)
//   - 投稿は "@accountID"。accountID は半角英数字と _ - のみなので、
//     ハッシュタグのように「空白まで」ではなく文字種で終端する。
//     ("@taroさん" や "@taro、" も正しく切れる)
//   - コミュニティは "@表示名"。表示名は空白も記号も含みうるため本文からは終端を決められない。
//     そのため「サジェストから選んだものだけがメンションとして成立する」仕様にしており、
//     表示側は保存済みのメンション一覧との最長一致で区間を決める。

const WHITESPACE_REGEX = /\s/;
const MENTION_MARKER_REGEX = /[@＠]/;
const ACCOUNT_ID_CHAR_REGEX = /[a-zA-Z0-9_-]/;

// サーバーの model.MaxAccountIDLength / MaxUserNameLength と揃える。
const MAX_ACCOUNT_ID_LENGTH = 25;
const MAX_MENTION_NAME_LENGTH = 50;

// メンションの相手。サジェスト候補と、保存済みメンションの向き先は同じ形なので
// 1つの型にまとめている。
export type MentionCandidate = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

// メンション先。GraphQL の Mention 型（user と本文中の表記 text）に対応する。
export type Mention = {
  user: MentionCandidate;
  text: string;
};

// 入力中のメンショントークン。start/end は本文中の置換範囲。
export type ActiveMention = {
  query: string;
  start: number;
  end: number;
};

export function isMentionMarker(ch: string | undefined): boolean {
  return ch !== undefined && MENTION_MARKER_REGEX.test(ch);
}

// マーカーが本文先頭 or 直前が空白かを判定する。
export function isMarkerBoundary(text: string, markerIndex: number): boolean {
  return markerIndex === 0 || WHITESPACE_REGEX.test(text[markerIndex - 1]);
}

/**
 * 投稿向け: キャレット位置から、いま編集中の "@accountID" を取り出す。
 * 返り値は { query: マーカーの後ろ〜caret, start: マーカー位置, end: トークン末尾 }。
 * メンション入力中でなければ null。
 */
export function getActiveAccountMention(text: string, caret: number): ActiveMention | null {
  let i = caret - 1;
  while (i >= 0 && ACCOUNT_ID_CHAR_REGEX.test(text[i])) i--;
  if (i < 0 || !isMentionMarker(text[i])) return null;
  if (!isMarkerBoundary(text, i)) return null;

  const query = text.slice(i + 1, caret);
  if (query.length > MAX_ACCOUNT_ID_LENGTH) return null;

  let end = caret;
  while (end < text.length && ACCOUNT_ID_CHAR_REGEX.test(text[end])) end++;
  return { query, start: i, end };
}

/**
 * コミュニティ向け: キャレット位置から、いま編集中の "@表示名" を取り出す。
 *
 * 表示名は空白を含みうるので、マーカーから caret までをそのまま query にする
 * （空白をまたいでも候補を出し続ける）。候補が尽きればサジェストは自然に閉じるので、
 * 「@ のあとに普通の文章を書いた」ケースは候補0件として扱われる。
 * end は caret のまま。名前の終端は本文からは決められないため、
 * 確定時に置き換えるのは「マーカー〜caret」だけにする。
 */
export function getActiveNameMention(text: string, caret: number): ActiveMention | null {
  // 走査コストを抑えるため、表示名の上限文字数ぶんだけ遡る。
  const lowerBound = Math.max(0, caret - (MAX_MENTION_NAME_LENGTH + 1));
  for (let i = caret - 1; i >= lowerBound; i--) {
    const ch = text[i];
    if (ch === '\n') return null; // 改行はまたがない
    if (!isMentionMarker(ch)) continue;
    if (!isMarkerBoundary(text, i)) return null;
    return { query: text.slice(i + 1, caret), start: i, end: caret };
  }
  return null;
}

/**
 * 表示側: index のマーカー位置から始まるメンションを、保存済みのメンション一覧から探す。
 * 表示名は前方一致で複数該当しうるので（"山田" と "山田 太郎"）、最長一致を優先する。
 * 該当が無ければ null（通常テキストとして描画する）。
 */
export function findMentionAt(text: string, index: number, mentions: Mention[]): Mention | null {
  if (!isMentionMarker(text[index]) || !isMarkerBoundary(text, index)) return null;

  let longest: Mention | null = null;
  for (const mention of mentions) {
    if (mention.text === '') continue;
    if (!text.startsWith(mention.text, index + 1)) continue;
    if (longest === null || mention.text.length > longest.text.length) {
      longest = mention;
    }
  }
  return longest;
}

/**
 * サジェスト確定時の本文差し替え。
 * 直後が空白でなければ空白を補い、続けて入力できるようにする（ハッシュタグと同じ挙動）。
 * 返り値の caret は挿入後のキャレット位置。
 */
export function applyMention(
  value: string,
  active: ActiveMention,
  mentionText: string,
): { value: string; caret: number } {
  const before = value.slice(0, active.start);
  const after = value.slice(active.end);
  const needsSpace = after === '' || !WHITESPACE_REGEX.test(after[0]);
  const inserted = `@${mentionText}${needsSpace ? ' ' : ''}`;
  return {
    value: `${before}${inserted}${after}`,
    caret: before.length + inserted.length,
  };
}

// 本文に "@<name>" がメンションとして書かれているかを判定する。
// サジェストで選んだあとに本文を書き換えた場合に備え、送信前に「まだ本文に残っているか」を
// 確かめるのに使う（サーバー側でも同じ検証を行う）。
// 表示名は正規表現のメタ文字を含みうるため、素朴な走査で判定する。
export function containsMentionText(text: string, name: string): boolean {
  if (name === '') return false;
  for (let i = 0; i < text.length; i++) {
    if (!isMentionMarker(text[i])) continue;
    if (!isMarkerBoundary(text, i)) continue;
    if (text.startsWith(name, i + 1)) return true;
  }
  return false;
}
