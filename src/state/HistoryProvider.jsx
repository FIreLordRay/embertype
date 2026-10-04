import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { createHistoryStore, HISTORY_KEY, HistoryContext } from './history.js'

/** One store for the whole app (see createHistoryStore for how it keeps your history safe). */
const store = createHistoryStore(() => window.localStorage)

/**
 * Global state #2: every finished test, kept in localStorage so the stats page has a history
 * to show the next time you open the app.
 *
 * It changes once per test, not once per keystroke, so Context is still the right way to
 * hand it out. The data itself lives in a small external store, read with
 * useSyncExternalStore, because saving has to start from localStorage (which another tab may
 * have changed), not from React state.
 */
export function HistoryProvider({ children }) {
  const { results, status } = useSyncExternalStore(store.subscribe, store.getSnapshot)

  // Another tab saved or cleared the history: show the new list.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === HISTORY_KEY || e.key === null) store.reload() // null: storage was cleared
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(
    () => ({
      results,
      status,
      addResult: store.addResult,
      clearHistory: store.clearHistory,
      importResults: store.importResults,
    }),
    [results, status],
  )

  return <HistoryContext value={value}>{children}</HistoryContext>
}
