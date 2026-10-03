/**
 * Results history: pure functions over the list of finished tests.
 *
 * The list itself is saved in localStorage (see src/state/history.js). Everything the stats
 * page shows is computed from it here, so all of it can be unit-tested without a browser.
 */
import { MODES, TRAINING_MODES } from '../config/modes.js'
import { CHARS_PER_WORD, computeStats } from './metrics.js'
import { keyFor } from './qwerty.js'

/**
 * One finished test, as saved.
 *
 * @typedef {Object} TestResult
 * @property {string} id            unique per test
 * @property {number} date          when it finished (Date.now())
 * @property {'time' | 'words' | 'quote' | 'practice' | 'lesson'} mode
 * @property {number | string} amount
 *   seconds (time), word count (words, practice), length group (quote), or lesson number
 * @property {number} wpm
 * @property {number} raw
 * @property {number} accuracy
 * @property {number} errors
 * @property {number} ms            how long the test took
 * @property {Record<string, [number, number]>} keys
 *   per expected character: [attempts, misses], e.g. { e: [42, 3] }
 * @property {boolean} [punctuation]  time/words tests typed with punctuation mixed in
 * @property {boolean} [numbers]      …and with numbers mixed in
 * @property {string[]} [targets]   practice drills only: the keys the drill focused on
 */

/** A test with less than one word of correct typing was an accidental start: don't save it. */
export const MIN_CORRECT_CHARS = CHARS_PER_WORD

/**
 * Practice drills and lessons are training, not tests: their words are picked to be hard or
 * limited to a few letters, so they stay out of "all", personal bests and the speed trend.
 */
export const isTraining = (result) => TRAINING_MODES.includes(result.mode)
export const isPractice = (result) => result.mode === 'practice'

/** Every regular test option in nav order: ['time 15', …, 'words 50', 'quote short', …] */
export const MODE_KEYS = Object.entries(MODES)
  .filter(([mode]) => !TRAINING_MODES.includes(mode))
  .flatMap(([mode, { options }]) => options.map((n) => `${mode} ${n}`))

/** 'time 30', 'words 25', 'quote long', 'practice 10', 'lesson 4', … */
export const modeKey = (result) => `${result.mode} ${result.amount}`

/** Same punctuation and numbers settings? Only then are two speeds fair to compare. */
export const sameExtras = (a, b) => Boolean(a.punctuation) === Boolean(b.punctuation) && Boolean(a.numbers) === Boolean(b.numbers)

/**
 * Attempts and misses for every key in a test's input log.
 *
 * @param {import('./typingEngine.js').InputEvent[]} log
 * @returns {Record<string, [number, number]>} per expected character: [attempts, misses]
 */
export function countKeys(log) {
  const keys = {}
  for (const event of log) {
    if (event.type !== 'char') continue
    const counts = (keys[event.expected] ??= [0, 0])
    counts[0]++
    if (event.actual !== event.expected) counts[1]++
  }
  return keys
}

/**
 * Build the record to save for a finished test, or null if it's too short to count.
 *
 * @param {{ id: string, date: number, mode: TestResult['mode'], amount: number | string,
 *           target: string, typed: string, log: import('./typingEngine.js').InputEvent[],
 *           elapsedMs: number, targets?: string[], punctuation?: boolean, numbers?: boolean }} test
 * @returns {TestResult | null}
 */
export function createResult({ id, date, mode, amount, target, typed, log, elapsedMs, targets = [], punctuation = false, numbers = false }) {
  const stats = computeStats({ target, typed, log, elapsedMs })
  if (stats.correctChars < MIN_CORRECT_CHARS) return null

  return {
    id,
    date,
    mode,
    amount,
    wpm: stats.wpm,
    raw: stats.raw,
    accuracy: stats.accuracy,
    errors: stats.errors,
    ms: elapsedMs,
    keys: countKeys(log),
    // Only stored when on, so plain tests stay as small as before.
    ...(punctuation && { punctuation }),
    ...(numbers && { numbers }),
    ...(targets.length > 0 && { targets }),
  }
}

/**
 * @param {TestResult[]} results
 * @param {string} key  'all' (every regular test), 'practice' (drills), 'lessons', or a mode key
 */
export function filterByMode(results, key) {
  if (key === 'all') return results.filter((result) => !isTraining(result))
  if (key === 'practice') return results.filter(isPractice)
  if (key === 'lessons') return results.filter((result) => result.mode === 'lesson')
  return results.filter((result) => modeKey(result) === key)
}

/**
 * Combine imported results with the ones already saved: matched by id (so importing the same
 * file twice changes nothing), oldest first, newest `max` kept.
 *
 * @param {TestResult[]} existing
 * @param {TestResult[]} incoming
 * @param {number} max
 * @returns {{ results: TestResult[], added: number }}
 */
export function mergeResults(existing, incoming, max) {
  const byId = new Map(existing.map((result) => [result.id, result]))
  let added = 0
  for (const result of incoming) {
    if (byId.has(result.id)) continue
    byId.set(result.id, result)
    added++
  }
  const results = [...byId.values()].sort((a, b) => a.date - b.date).slice(-max)
  return { results, added }
}

/**
 * The headline numbers. "Recent" means your last 10 tests, which is your current level.
 * `previousWpm` averages the tests before those (needs at least 3), so the page can say
 * whether you're trending up.
 *
 * @param {TestResult[]} results oldest first
 */
export function summarize(results, window = 10) {
  const recent = results.slice(-window)
  const previous = results.slice(Math.max(0, results.length - 2 * window), Math.max(0, results.length - window))
  return {
    tests: results.length,
    totalMs: results.reduce((sum, result) => sum + result.ms, 0),
    best: results.reduce((best, result) => (best && best.wpm >= result.wpm ? best : result), null),
    recentWpm: mean(recent.map((result) => result.wpm)),
    recentAccuracy: mean(recent.map((result) => result.accuracy)),
    previousWpm: previous.length >= 3 ? mean(previous.map((result) => result.wpm)) : null,
  }
}

/**
 * Best result for each mode, plus how many tests you've done in it. On a tie the earlier
 * result keeps the title: it got there first.
 *
 * @param {TestResult[]} results
 * @returns {Map<string, { best: TestResult, count: number }>}
 */
export function personalBests(results) {
  const bests = new Map()
  for (const result of results) {
    const key = modeKey(result)
    const entry = bests.get(key)
    if (!entry) bests.set(key, { best: result, count: 1 })
    else bests.set(key, { best: result.wpm > entry.best.wpm ? result : entry.best, count: entry.count + 1 })
  }
  return bests
}

/**
 * Your best wpm in a mode *before* a given test, or null if that test is your first.
 * The results screen uses it to spot a new personal best. Only tests with the same
 * punctuation and numbers settings count: a run with punctuation shouldn't have to beat a
 * plain one.
 *
 * @param {TestResult[]} results
 * @param {string} key        mode key, e.g. 'time 30'
 * @param {string} excludeId  the test being judged
 * @param {{ punctuation?: boolean, numbers?: boolean }} [extras]
 */
export function previousBest(results, key, excludeId, extras = {}) {
  let best = null
  for (const result of results) {
    if (result.id === excludeId || modeKey(result) !== key || !sameExtras(result, extras)) continue
    if (best === null || result.wpm > best) best = result.wpm
  }
  return best
}

/**
 * Attempts, misses and miss rate for every character typed across the given results.
 *
 * @param {TestResult[]} results
 * @returns {Map<string, { char: string, attempts: number, misses: number, rate: number }>}
 */
export function keyTotals(results) {
  const totals = new Map()
  for (const result of results) {
    for (const [char, [attempts, misses]] of Object.entries(result.keys)) {
      const total = totals.get(char) ?? { char, attempts: 0, misses: 0, rate: 0 }
      total.attempts += attempts
      total.misses += misses
      total.rate = total.misses / total.attempts
      totals.set(char, total)
    }
  }
  return totals
}

/**
 * Each key's miss rate across all results: misses ÷ attempts.
 *
 * Rates, not raw counts: "e" gets missed the most just because it's the most common letter.
 * Keys with fewer than `minAttempts` attempts are left out, because there's too little data
 * to judge them.
 *
 * @param {TestResult[]} results
 * @returns {{ char: string, attempts: number, misses: number, rate: number }[]} worst first
 */
export function keyStats(results, minAttempts = 20) {
  return [...keyTotals(results).values()]
    .filter((total) => total.attempts >= minAttempts && total.misses > 0)
    .sort((a, b) => b.rate - a.rate || b.misses - a.misses)
}

/**
 * Like keyTotals, but per *physical key*: "A" and "a" both count toward the A key, "?"
 * toward the / key. This is what the keyboard heatmap colours.
 *
 * @param {TestResult[]} results
 * @returns {Map<string, { key: string, attempts: number, misses: number, rate: number }>}
 */
export function keyTotalsByKey(results) {
  const byKey = new Map()
  for (const { char, attempts, misses } of keyTotals(results).values()) {
    const key = keyFor(char)?.key
    if (key === undefined) continue // a character a US keyboard can't type directly
    const total = byKey.get(key) ?? { key, attempts: 0, misses: 0, rate: 0 }
    total.attempts += attempts
    total.misses += misses
    total.rate = total.misses / total.attempts
    byKey.set(key, total)
  }
  return byKey
}

/**
 * Trailing average: point i is the mean of the `window` values ending at i
 * (fewer at the very start, where there aren't `window` values yet).
 *
 * @param {number[]} values
 * @param {number} window
 */
export function movingAverage(values, window) {
  const averages = []
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= window) sum -= values[i - window]
    averages.push(sum / Math.min(i + 1, window))
  }
  return averages
}

/** 45s · 12m · 1h 05m */
export function formatDuration(ms) {
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "just now" · "5 minutes ago" · "yesterday" · "3 days ago" · "Sep 30" */
export function timeAgo(date, now) {
  const seconds = Math.round((date - now) / 1000) // negative: in the past
  if (seconds > -45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes > -60) return relative.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours > -24) return relative.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (days > -30) return relative.format(days, 'day')
  return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function mean(values) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length
}
