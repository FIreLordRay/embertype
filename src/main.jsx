import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts, bundled by Vite: no requests to Google, works offline.
// All four are declared, but the browser only downloads the one the current theme uses.
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/roboto-mono'
import '@fontsource/share-tech-mono'
import '@fontsource/special-elite'

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
