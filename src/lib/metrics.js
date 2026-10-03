/**
 * Typing metrics: pure functions of the engine state.
 *
 * Nothing here is ever stored. The live display, the results screen and the chart all call
 * these same functions, so the numbers can't disagree with each other.
 */

/** A "standard word" is 5 characters (spaces included). Every typing test uses this convention. */
export const CHARS_PER_WORD = 5

/**
 * Words per minute = (characters ÷ 5) ÷ minutes.
 *
 * @param {number} chars
 * @param {number} ms elapsed time
 */
export function wpm(chars, ms) {
  if (ms <= 0) return 0
  return chars / CHARS_PER_WORD / (ms / 60_000)
}

/**
 * Accuracy % = correct keystrokes ÷ total keystrokes × 100 (100 before the first keystroke).
 *
 * @param {number} correct
 * @param {number} total
 */
export function accuracy(correct, total) {
  return total === 0 ? 100 : (correct / total) * 100
}

/**
 * How many characters of `typed` currently match `target`.
 *
 * @param {string} target
 * @param {string} typed
 */
export function countCorrectChars(target, typed) {
  let correct = 0
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correct++
  return correct
}

/**
 * Words completed so far (the "12/25" counter in words mode): spaces passed in the target.
 *
 * @param {string} target
 * @param {number} cursor
 */
export function completedWords(target, cursor) {
  let words = 0
  for (let i = 0; i < cursor; i++) if (target[i] === ' ') words++
  return words
}

/**
 * Every number for one moment of a test.
 *
 *  - wpm       counts characters that are correct *right now*: a fixed mistake counts,
 *              an uncorrected one doesn't
 *  - raw       counts every character keystroke, including mistakes and deleted characters
 *              (pure finger speed)
 *  - accuracy  is measured on keystrokes, so a mistake you fixed still costs accuracy
 *  - errors    is the number of wrong keystrokes, fixed or not
 *
 * @param {{ target: string, typed: string, log: import('./typingEngine.js').InputEvent[], elapsedMs: number }} input
 */
export function computeStats({ target, typed, log, elapsedMs }) {
  let keystrokes = 0
  let correctKeystrokes = 0
  for (const event of log) {
    if (event.type !== 'char') continue
    keystrokes++
    if (event.actual === event.expected) correctKeystrokes++
  }
  const correctChars = countCorrectChars(target, typed)

  return {
    wpm: wpm(correctChars, elapsedMs),
    raw: wpm(keystrokes, elapsedMs),
    accuracy: accuracy(correctKeystrokes, keystrokes),
    errors: keystrokes - correctKeystrokes,
    keystrokes,
    correctChars,
    incorrectChars: typed.length - correctChars,
    elapsedMs,
  }
}

/**
 * Per-second data for the results chart, rebuilt by replaying the input log.
 *
 * For each second: the wpm and raw wpm *so far* (cumulative, so the last point equals the
 * final result), and the mistakes made *during* that second (the error spikes).
 *
 * @param {{ target: string, log: import('./typingEngine.js').InputEvent[], elapsedMs: number }} input
 * @returns {{ second: number, wpm: number, raw: number, errors: number }[]}
 */
export function buildTimeline({ target, log, elapsedMs }) {
  const seconds = Math.max(1, Math.ceil(elapsedMs / 1000))
  const points = []
  let typed = ''
  let keystrokes = 0
  let next = 0

  for (let second = 1; second <= seconds; second++) {
    const isLast = second === seconds
    const windowEnd = isLast ? elapsedMs : second * 1000
    let errors = 0

    // The last window takes every remaining event: the keystroke that finishes a words test
    // lands exactly on elapsedMs, which a strict `t < windowEnd` would drop.
    while (next < log.length && (isLast || log[next].t < windowEnd)) {
      const event = log[next++]
      if (event.type === 'char') {
        typed += event.actual
        keystrokes++
        if (event.actual !== event.expected) errors++
      } else {
        typed = typed.slice(0, typed.length - event.count)
      }
    }

    // Full precision here; rounding is the display's job. (Pre-rounding 799.96 to 800.0 would
    // make the chart disagree with the headline, which floors the exact value to 799.)
    points.push({
      second,
      wpm: wpm(countCorrectChars(target, typed), windowEnd),
      raw: wpm(keystrokes, windowEnd),
      errors,
    })
  }
  return points
}

/**
 * The characters you got wrong most often: the keys worth practising.
 *
 * @param {import('./typingEngine.js').InputEvent[]} log
 * @param {number} [limit=5]
 * @returns {{ char: string, count: number }[]} most-missed first
 */
export function missedKeys(log, limit = 5) {
  const counts = new Map()
  for (const event of log) {
    if (event.type === 'char' && event.actual !== event.expected) {
      counts.set(event.expected, (counts.get(event.expected) ?? 0) + 1)
    }
  }
  return [...counts]
    .map(([char, count]) => ({ char, count }))
    .sort((a, b) => b.count - a.count || a.char.localeCompare(b.char))
    .slice(0, limit)
}
