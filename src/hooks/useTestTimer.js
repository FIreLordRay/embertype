import { useEffect, useState } from 'react'

/** How often the screen refreshes while a test runs. The timing itself never depends on it. */
const TICK_MS = 100

/**
 * The test clock: elapsed and remaining time, and the countdown hitting zero.
 *
 * It never counts anything. Elapsed time is always `now - startedAt`, where `startedAt` is
 * recorded by the engine on the first keystroke. Counting down with `seconds--` inside a
 * setInterval drifts: intervals fire late, and browsers throttle background tabs. Here a
 * late tick only delays a screen update; it can't make the clock wrong.
 *
 *  - Starts by itself: the first keystroke flips `status` to 'running'.
 *  - Stops by itself: `onTimeUp` fires when the countdown reaches zero, and the engine flips
 *    `status` to 'finished' (also when the text runs out), which clears the interval.
 *
 * @param {{
 *   status: import('../lib/typingEngine.js').Status,
 *   startedAt: number | null,
 *   endedAt: number | null,
 *   timeLimitMs: number | null,
 *   onTimeUp: () => void,
 * }} clock
 * @returns {{ elapsedMs: number, remainingMs: number | null }}
 */
export function useTestTimer({ status, startedAt, endedAt, timeLimitMs, onTimeUp }) {
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => {
      const t = performance.now()
      setNow(t)
      if (timeLimitMs != null && t - startedAt >= timeLimitMs) onTimeUp()
    }, TICK_MS)
    return () => clearInterval(id)
  }, [status, startedAt, timeLimitMs, onTimeUp])

  let elapsedMs = 0
  if (startedAt != null) {
    elapsedMs = Math.max(0, (endedAt ?? now) - startedAt)
    if (timeLimitMs != null) elapsedMs = Math.min(elapsedMs, timeLimitMs)
  }
  return { elapsedMs, remainingMs: timeLimitMs == null ? null : timeLimitMs - elapsedMs }
}
