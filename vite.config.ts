import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
        target: 'http://host.docker.internal:8080',
        changeOrigin: true,
        ws: true,
      },
      '/events': {
        target: 'http://host.docker.internal:8080',
        changeOrigin: true,
      },
      '/space-storage': {
        target: 'http://host.docker.internal:9000',
        changeOrigin: true,
      },
    },
  },
})
