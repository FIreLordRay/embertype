import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The "real" app (desktop shortcut, `npm run preview`) always lives on port 4173.
  // Saved settings and history belong to the exact address, so a silent fallback to 4174
  // would look like your history had vanished; strictPort fails loudly instead.
  // `npm run dev` stays on 5173, so experiments there never touch your real stats.
  preview: { port: 4173, strictPort: true },
  test: {
    // Everything under test lives in src/lib: plain functions, no DOM needed.
    environment: 'node',
  },
})
