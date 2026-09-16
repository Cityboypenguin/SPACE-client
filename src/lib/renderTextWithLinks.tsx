import type { ReactNode } from 'react';
import { findMentionAt, type Mention } from './mentions';
import styles from './renderTextWithLinks.module.css';

// URL・ハッシュタグ・メンションを 1 つの走査でトークン化する。
//
// ハッシュタグ仕様（サーバーの usecase/post/hashtag.go と挙動を揃える）:
//   - マーカーは "#"（半角ハッシュ）。直後に空白は挟まない（"#aaa" がハッシュタグ）。
//   - マーカーは本文先頭、または直前が空白（半角/全角スペース・タブ・改行）のときのみ有効。
//     ("あいう#うえお" は反応せず、"あいう #うえお" のみ反応する)
//   - タグ本体はマーカー直後から最初の空白まで（\s は全角スペース U+3000 も含む）。
//
// メンション仕様（src/lib/mentions.ts、サーバーの usecase/*/mention.go と揃える）:
//   - マーカー "@"/"＠" の位置条件はハッシュタグと同じ。
//   - どこからどこまでがメンションかは本文だけでは決められない（表示名は空白を含む）ため、
//     保存済みのメンション一覧 (mentions) と突き合わせ、最長一致した区間だけをリンクにする。
//     一覧に無い "@なにか" は通常テキストとして描画する。
//
// 全角スペース(U+3000)は \s に含まれるため URL の区切りとして別途列挙する必要はない。
const TOKEN_REGEX = /(https?:\/\/[^\s、。！？「」（）【】『』〔〕《》…‥・]+)|(#[^\s]+)|([@＠])/g;
const WHITESPACE_REGEX = /\s/;

type Options = {
  text: string;
  linkClassName?: string;
  onHashtagClick?: (tag: string) => void;
  // 本文に紐づく保存済みのメンション。渡さなければメンションは描画しない。
  mentions?: Mention[];
  // 自分宛のメンションだけ強調するためのユーザーID。
  currentUserID?: string | null;
  onMentionClick?: (userID: string) => void;
  stopPropagation?: boolean;
};

// enableHashtags は呼び出し側が意識する設定ではなく「この画面ではハッシュタグを
// リンクとして扱うか」という文脈そのものなので、真偽フラグを公開せず
// renderTextWithLinks / renderChatText の2つの入口に分けている。
type InternalOptions = Options & { enableHashtags: boolean };

const renderRichText = ({
  text,
  linkClassName,
  onHashtagClick,
  mentions = [],
  currentUserID,
  onMentionClick,
  enableHashtags,
  stopPropagation = false,
}: InternalOptions): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_REGEX.exec(text)) !== null) {
    const [full, url, hashtag, mentionMarker] = match;
    const start = match.index;

    // ハッシュタグは先頭 or 直前が空白のときのみ有効。それ以外は通常テキストとして扱う。
    if (hashtag && (!enableHashtags || !(start === 0 || WHITESPACE_REGEX.test(text[start - 1])))) {
      continue;
    }

    // マーカーだけでは足りないので、保存済みメンションと突き合わせて区間を確定させる。
    let mention: Mention | null = null;
    if (mentionMarker) {
      mention = mentions.length > 0 ? findMentionAt(text, start, mentions) : null;
      if (!mention) continue;
    }

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    if (url) {
      nodes.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
          onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
        >
          {url}
        </a>,
      );
      lastIndex = start + full.length;
    } else if (hashtag) {
      const tag = hashtag.slice(1); // "#" を除いたタグ本体
      nodes.push(
        <span
          key={key++}
          className={[
            styles.hashtag,
            onHashtagClick ? styles.hashtagClickable : '',
          ].filter(Boolean).join(' ')}
          onClick={onHashtagClick ? (e) => { e.stopPropagation(); onHashtagClick(tag); } : undefined}
        >
          {hashtag}
        </span>,
      );
      lastIndex = start + full.length;
    } else if (mention) {
      const isSelf = currentUserID != null && mention.user.ID === currentUserID;
      const label = `${text[start]}${mention.text}`; // マーカーは本文の表記（半角/全角）をそのまま使う
      nodes.push(
        <span
          key={key++}
          className={[
            styles.mention,
            isSelf ? styles.mentionSelf : '',
            onMentionClick ? styles.mentionClickable : '',
          ].filter(Boolean).join(' ')}
          onClick={onMentionClick ? (e) => { e.stopPropagation(); onMentionClick(mention.user.ID); } : undefined}
        >
          {label}
        </span>,
      );
      // マーカー1文字 + メンション本体の長さぶん進める。
      lastIndex = start + 1 + mention.text.length;
      TOKEN_REGEX.lastIndex = lastIndex;
    }
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

// 投稿本文・コミュニティ説明文など、ハッシュタグをリンクとして扱う場所用。
export const renderTextWithLinks = (options: Options): ReactNode[] =>
  renderRichText({ ...options, enableHashtags: true });

// チャット本文用。ハッシュタグ検索への導線が無い画面なので "#..." は通常テキストのまま描く。
export const renderChatText = (options: Options): ReactNode[] =>
  renderRichText({ ...options, enableHashtags: false });
