import type { ReactNode } from 'react';

// URL とハッシュタグを 1 つの走査でトークン化する。
// ハッシュタグ仕様（サーバーの usecase/post/hashtag.go と挙動を揃える）:
//   - マーカーは "#"（半角ハッシュ）。直後に空白は挟まない（"#aaa" がハッシュタグ）。
//   - マーカーは本文先頭、または直前が空白（半角/全角スペース・タブ・改行）のときのみ有効。
//     ("あいう#うえお" は反応せず、"あいう #うえお" のみ反応する)
//   - タグ本体はマーカー直後から最初の空白まで（\s は全角スペース U+3000 も含む）。
// 全角スペース(U+3000)は \s に含まれるため URL の区切りとして別途列挙する必要はない。
const TOKEN_REGEX = /(https?:\/\/[^\s、。！？「」（）【】『』〔〕…‥・]+)|(#[^\s]+)/g;
const WHITESPACE_REGEX = /\s/;
const HASHTAG_COLOR = '#1d9bf0';

type Props = {
  text: string;
  linkClassName?: string;
  hashtagClassName?: string;
  onHashtagClick?: (tag: string) => void;
};

export const renderTextWithLinks = ({ text, linkClassName, hashtagClassName, onHashtagClick }: Props): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_REGEX.exec(text)) !== null) {
    const [full, url, hashtag] = match;
    const start = match.index;

    // ハッシュタグは先頭 or 直前が空白のときのみ有効。それ以外は通常テキストとして扱う。
    if (hashtag && !(start === 0 || WHITESPACE_REGEX.test(text[start - 1]))) {
      continue;
    }

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    if (url) {
      nodes.push(
        <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          {url}
        </a>,
      );
    } else if (hashtag) {
      const tag = hashtag.slice(1); // "#" を除いたタグ本体
      nodes.push(
        <span
          key={key++}
          className={hashtagClassName}
          style={{ color: HASHTAG_COLOR, cursor: onHashtagClick ? 'pointer' : undefined }}
          onClick={onHashtagClick ? (e) => { e.stopPropagation(); onHashtagClick(tag); } : undefined}
        >
          {hashtag}
        </span>,
      );
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};
