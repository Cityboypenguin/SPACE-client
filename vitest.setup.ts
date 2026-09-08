// @testing-library/jest-dom の Vitest 向けエントリ。`toBeInTheDocument` 等の
// カスタムマッチャーをランタイムに登録すると同時に、`vitest` モジュールの
// `Assertion` 型を拡張する（型定義側の拡張が効くのは、このファイルが
// tsconfig.app.json の include に含まれているため）。
import '@testing-library/jest-dom/vitest';

// jsdom は window.matchMedia を実装していない。ChatInput（タッチ判定）や
// ThemeContext（ダークモード判定）が呼び出すため、テスト全体で使えるように
// 最小限のダミー実装を用意する（常に matches: false = 非タッチ・ライトモード扱い）。
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
