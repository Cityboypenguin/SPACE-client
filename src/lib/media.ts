import { graphql } from '../generated';

// 添付メディアの形はユーザー画面・管理画面・投稿・チャット・質問・通知で共通なので、
// 型と GraphQL の選択セットをここに集約する。Media に属性を足すときに
// 触る箇所を1つに保つのが目的（以前は同じ形が7箇所に複製されていた）。

export type Media = {
  ID: string;
  url: string;
  contentType: string;
  // 画像の実寸。表示側がロード前に領域を確保するために使う。
  // 寸法を持たないメディアや、埋め戻し前の古いレコードでは null。
  width?: number | null;
  height?: number | null;
};

export type MediaInput = {
  objectKey: string;
  contentType: string;
  width?: number;
  height?: number;
};

// codegen 対象のドキュメントからは `media { ...MediaFields }` として参照する。
// 生成される DocumentNode にはフラグメント定義が同梱されるため、そのまま送信できる。
export const MediaFieldsFragment = graphql(`
  fragment MediaFields on Media {
    ID
    url
    contentType
    width
    height
  }
`);

// codegen を通さない生のクエリ文字列（WebSocket サブスクリプション）にも同じ選択セットが要る。
// ただし codegen が解析するドキュメントは静的な文字列でなければならず、そちらに補間は使えない。
// そこで、フラグメントの AST から選択セットのテキストを導出して手作業の同期をなくす。
const mediaFieldNames = MediaFieldsFragment.definitions.flatMap((definition) => {
  if (definition.kind !== 'FragmentDefinition') return [];
  return definition.selectionSet.selections.map((selection) => {
    // 入れ子の選択やフラグメントのスプレッドが入ると素朴な連結では表現できない。
    // その時は静かに壊れるのではなく、ここで気付けるようにする。
    if (selection.kind !== 'Field' || selection.selectionSet) {
      throw new Error('MediaFields フラグメントは平坦なフィールドのみで構成してください');
    }
    return selection.name.value;
  });
});

/** 生のクエリ文字列に `media {${MEDIA_FIELDS_RAW}}` の形で埋め込む。 */
export const MEDIA_FIELDS_RAW = `\n    ${mediaFieldNames.join('\n    ')}\n  `;
