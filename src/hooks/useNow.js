import { useEffect, useState } from 'react'

/**
 * The current time, refreshed every `intervalMs` (default: once a minute).
 * For displays that depend on the date, like a streak or "5 minutes ago", so they stay right
 * even if the app is left open past midnight.
 */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
