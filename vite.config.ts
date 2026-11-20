import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 既定は Docker の開発環境。CI などでは環境変数で接続先を変える。
const apiTarget = process.env.SPACE_API_PROXY_TARGET ?? 'http://host.docker.internal:8080'
const storageTarget = process.env.SPACE_STORAGE_PROXY_TARGET ?? 'http://host.docker.internal:9000'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 動画の圧縮 Worker が使う。開発サーバーが初めて読み込んだときに依存を見つけて
  // ページごと再読み込みしないよう、先に束ねておく。
  optimizeDeps: {
    include: ['mediabunny'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/generated/')) return 'graphql-generated'
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react-router')) {
            return 'react-vendor'
          }
          if (id.includes('/node_modules/graphql/')) return 'graphql-vendor'
          return undefined
        },
      },
    },
  },
  server: {
    host: true, // Dockerコンテナの外からアクセスできるようにする設定
    proxy: {
      '/query': {
        target: apiTarget,
        changeOrigin: true,
        ws: true,
      },
      '/events': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/space-storage': {
        target: storageTarget,
        changeOrigin: true,
      },
      // DM の添付の置き場（compose.yaml の MESSAGE_MEDIA_CONTAINER）。
      '/space-message-media': {
        target: storageTarget,
        changeOrigin: true,
      },
      // 動画とサムネイルの置き場（compose.yaml の VIDEO_CONTAINER）。
      '/space-videos': {
        target: storageTarget,
        changeOrigin: true,
      },
    },
  },
})
