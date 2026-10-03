import { useEffect, useMemo, useState } from 'react'
import { SettingsContext, loadSettings, saveSettings } from './settings.js'

/**
 * The app's only global state: preferences (mode, duration, word count, theme).
 *
 * They change rarely and several unrelated components read them (nav bar, test, theme
 * picker), which is exactly what Context is for. Fast-changing test state does NOT live
 * here: putting per-keystroke state in Context would re-render every consumer on every key.
 */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  // Apply the theme: one attribute on <html>; the CSS variables in index.css do the rest.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  const value = useMemo(
    () => ({ ...settings, update: (patch) => setSettings((current) => ({ ...current, ...patch })) }),
    [settings],
  )

  return <SettingsContext value={value}>{children}</SettingsContext>
}
