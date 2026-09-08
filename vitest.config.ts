import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest（単体テスト）用の設定。vite.config.ts はDev/Build用のプロキシ設定
// （Dockerコンテナ向けのAPIプロキシ等）を持っており単体テストには不要かつ
// 無関係な設定を混ぜたくないため、あえて独立した設定ファイルにしている。
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // e2e/ 配下はPlaywright専用のspecファイル（test.describe等のAPIが異なる）なので、
    // デフォルトのinclude（**/*.spec.ts等にもマッチする）から明示的に除外する。
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
