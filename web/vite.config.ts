import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Fall back to the next free port instead of hard-failing when 3000 is busy.
    strictPort: false,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    allowedHosts: true,
  },
  build: {
    // Build to a sibling folder so `site/` sits next to `web/` and can be
    // uploaded to any static host as-is.
    outDir: '../site',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        app: 'app.html',
      },
    },
  },
})
