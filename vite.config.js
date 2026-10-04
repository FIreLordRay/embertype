import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths, so the same build works at http://localhost:4173/ and on GitHub
  // Pages under /embertype/. Routing uses the #hash, so the page's own path never changes.
  base: './',
  plugins: [react(), tailwindcss()],
  // The "real" app (desktop shortcut, `npm run preview`) always lives on port 4173.
  // Saved settings and history belong to the exact address, so a silent fallback to 4174
  // would look like your history had vanished; strictPort fails loudly instead.
  // `npm run dev` stays on 5173, so experiments there never touch your real stats.
  preview: { port: 4173, strictPort: true },
  test: {
    // Everything under test is plain functions: no DOM needed.
    environment: 'node',
    // A time zone with daylight saving, on every machine (CI runs in UTC, which has none),
    // so the streak tests really cross 23- and 25-hour days.
    env: { TZ: 'America/Chicago' },
  },
})
