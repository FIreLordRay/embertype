import { createContext, useContext } from 'react'
import { MODES } from '../config/modes.js'

export const HISTORY_KEY = 'embertype:history'

/** Oldest results are dropped past this, staying far inside localStorage's ~5 MB limit. */
export const MAX_RESULTS = 1000

/** Bump when the saved shape changes, so old data can be migrated instead of misread. */
const VERSION = 1

/**
 * @typedef {{
 *   results: import('../lib/history.js').TestResult[],
 *   addResult: (result: import('../lib/history.js').TestResult) => void,
 *   clearHistory: () => void,
 *   importResults: (fileContents: unknown) => { valid: number, added: number },
 * }} HistoryValue
 */

/** The export file format: the same envelope localStorage uses, so import can reuse its checks. */
export function exportHistory(results) {
  return JSON.stringify({ version: VERSION, results }, null, 2)
}

/** @type {import('react').Context<HistoryValue | null>} */
export const HistoryContext = createContext(null)

/** Saved results (oldest first) plus addResult / clearHistory. Use under <HistoryProvider>. */
export function useHistory() {
  const history = useContext(HistoryContext)
  if (!history) throw new Error('useHistory() must be used inside <HistoryProvider>')
  return history
}

/**
 * Keep only well-formed results. Saved data can be from an older version, hand-edited, or
 * half-written, and one bad record shouldn't break the stats page.
 *
 * @param {unknown} saved the parsed localStorage value
 * @returns {import('../lib/history.js').TestResult[]}
 */
export function sanitizeHistory(saved) {
  const list = saved?.version === VERSION && Array.isArray(saved.results) ? saved.results : []
  return list.filter(isResult).slice(-MAX_RESULTS)
}

export function loadHistory() {
  try {
    return sanitizeHistory(JSON.parse(localStorage.getItem(HISTORY_KEY)))
  } catch {
    return [] // storage blocked, or corrupt JSON
  }
}

/**
 * Write only when the content actually changed. Every write fires a `storage` event in
 * other open tabs; skipping no-op writes stops two tabs echoing the same list back and forth.
 */
export function saveHistory(results) {
  try {
    const json = JSON.stringify({ version: VERSION, results })
    if (localStorage.getItem(HISTORY_KEY) !== json) localStorage.setItem(HISTORY_KEY, json)
  } catch {
    // Storage full or blocked: this session's results just won't be kept.
  }
}

function isResult(r) {
  return (
    r !== null &&
    typeof r === 'object' &&
    typeof r.id === 'string' &&
    Number.isFinite(r.date) &&
    Object.hasOwn(MODES, r.mode) &&
    // A number (seconds, words, lesson) or a quote length name.
    (Number.isFinite(r.amount) || (typeof r.amount === 'string' && r.amount.length > 0)) &&
    [r.wpm, r.raw, r.accuracy, r.errors, r.ms].every(Number.isFinite) &&
    r.keys !== null &&
    typeof r.keys === 'object' &&
    Object.values(r.keys).every((v) => Array.isArray(v) && v.length === 2 && v.every(Number.isFinite)) &&
    [r.punctuation, r.numbers].every((flag) => flag === undefined || typeof flag === 'boolean') &&
    // Practice drills also record which keys they targeted.
    (r.targets === undefined || (Array.isArray(r.targets) && r.targets.every((c) => typeof c === 'string' && c.length === 1)))
  )
}
