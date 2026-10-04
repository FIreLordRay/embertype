import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { createSettingsStore, SettingsContext, STORAGE_KEY } from './settings.js'

/** One store for the whole app (see createSettingsStore). */
const store = createSettingsStore(() => window.localStorage)

/**
 * The app's only global state: preferences (mode, duration, word count, theme).
 *
 * They change rarely and several unrelated components read them (nav bar, test, theme
 * picker), which is exactly what Context is for. Fast-changing test state does NOT live
 * here: putting per-keystroke state in Context would re-render every consumer on every key.
 */
export function SettingsProvider({ children }) {
  const settings = useSyncExternalStore(store.subscribe, store.getSnapshot)

  // Another tab changed a setting (or storage was cleared): follow it, so the tabs agree.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === null) store.reload()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Apply the theme: one attribute on <html>; the CSS variables in index.css do the rest.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  const value = useMemo(() => ({ ...settings, update: store.update }), [settings])

  return <SettingsContext value={value}>{children}</SettingsContext>
}
