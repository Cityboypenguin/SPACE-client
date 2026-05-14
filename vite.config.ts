import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Dockerコンテナの外からアクセスできるようにする設定
    proxy: {
      '/query': {
        target: 'http://host.docker.internal:8080',
        changeOrigin: true,
        ws: true,
      },
      '/space-avatars': {
        target: 'http://host.docker.internal:9000',
        changeOrigin: true,
      },
    },
  },
})