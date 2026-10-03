import { useCallback, useEffect, useMemo, useState } from 'react'
import { mergeResults } from '../lib/history.js'
import { HISTORY_KEY, HistoryContext, loadHistory, MAX_RESULTS, sanitizeHistory, saveHistory } from './history.js'

/**
 * Global state #2: every finished test, kept in localStorage so the stats page has a history
 * to show the next time you open the app.
 *
 * It changes once per test, not once per keystroke, so plain Context is still the right
 * tool. A store library would only earn its place if this grew much bigger.
 */
export function HistoryProvider({ children }) {
  const [results, setResults] = useState(loadHistory)

  useEffect(() => {
    saveHistory(results)
  }, [results])

  // Another tab saved a result: reload, so this tab doesn't overwrite it with a stale list.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === HISTORY_KEY) setResults(loadHistory())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Idempotent: saving the same test twice (React's StrictMode runs effects twice in
  // development) keeps a single copy, because results are matched by id.
  const addResult = useCallback((result) => {
    setResults((list) => (list.some((r) => r.id === result.id) ? list : [...list, result].slice(-MAX_RESULTS)))
  }, [])

  const clearHistory = useCallback(() => setResults([]), [])

  // An exported file goes through the same checks as saved data, then merges by id:
  // importing the same file twice adds nothing.
  const importResults = useCallback(
    (fileContents) => {
      const valid = sanitizeHistory(fileContents)
      const { results: merged, added } = mergeResults(results, valid, MAX_RESULTS)
      setResults(merged)
      return { valid: valid.length, added }
    },
    [results],
  )

  const value = useMemo(
    () => ({ results, addResult, clearHistory, importResults }),
    [results, addResult, clearHistory, importResults],
  )

  return <HistoryContext value={value}>{children}</HistoryContext>
}
