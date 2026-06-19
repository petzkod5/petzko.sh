import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

// App version, baked in at build time from package.json (bumped per release by
// semantic-release). Surfaced in the TUI header.
const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // In prod the resume-proxy backend serves /resume/* (mirroring the latest
  // resume release). There's no backend in `vite dev`, so proxy those requests
  // straight to the latest GitHub release asset — same behaviour, no CORS issue
  // (the dev server proxies server-side).
  server: {
    proxy: {
      '/resume': {
        target: 'https://github.com',
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) =>
          path.replace(
            /^\/resume/,
            '/petzkod5/resume/releases/latest/download',
          ),
      },
    },
  },
})
