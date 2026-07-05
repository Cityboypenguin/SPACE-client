import type { CodegenConfig } from '@graphql-codegen/cli';

// GraphQL 型と操作(query/mutation)の型を、サーバーの schema.graphqls から自動生成する。
// これにより「手書き型とクエリ選択セットのズレ」（存在しないフィールド参照などの実行時バグ）を
// 機械的に排除する。生成物は src/generated/ に出力され、独自 request() フェッチャと組み合わせて使う。
const config: CodegenConfig = {
  schema: '../SPACE-server/graph/schema.graphqls',
  documents: ['src/**/*.{ts,tsx}', '!src/generated/**/*'],
  ignoreNoDocuments: true,
  generates: {
    './src/generated/': {
      preset: 'client',
      presetConfig: {
        // フラグメントマスキングは既存の素朴な request() 利用と相性が悪いため無効化する。
        fragmentMasking: false,
      },
      config: {
        // このコードベースは 'POST' などの文字列リテラルで列挙値を扱うため、
        // TS enum ではなくユニオン型で生成し、既存の呼び出しをそのまま通す。
        enumsAsTypes: true,
        // verbatimModuleSyntax 有効のため、型は type-only import で生成させる。
        useTypeImports: true,
      },
    },
  },
};

export default config;
