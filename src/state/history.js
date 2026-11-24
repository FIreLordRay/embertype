import { createContext, useContext } from 'react'
import { MODES } from '../config/modes.js'
import { compactHistory, mergeResults, trimHistory } from '../lib/history.js'

export const HISTORY_KEY = 'embertype:history'

/** Where saved history embertype couldn't fully read is copied before it's first written over. */
export const BACKUP_KEY = 'embertype:history-backup'

/**
 * The most tests kept. Past this the oldest go first, but never your personal bests, lesson
 * passes or the last test of each day you practiced (see trimHistory).
 *
 * Measured with real tests: one saved test is about 450 characters (700 with punctuation and
 * numbers), or about 215 without its per-key counts. So 3000 tests, the newest 1000 with
 * counts, come to about 0.9 million characters, 1.25 million at most. Browsers allow 5 MiB per
 * site (MDN); even at 2 bytes a character that's 2.6 million, so there's room to spare.
 */
export const MAX_RESULTS = 3000

/** Only the newest tests keep per-key counts (see compactHistory). */
export const DETAILED_RESULTS = 1000

/** Bump when the saved shape changes, so old data can be migrated instead of misread. */
const VERSION = 1

/**
 * Whether new results are being saved:
 *  - 'saved'        yes
 *  - 'newer'        no: a newer version of embertype saved the history (another open tab, or
 *                   this one is out of date). It's left alone; reloading picks up the update.
 *  - 'unavailable'  no: the browser won't let embertype save (blocked or full storage).
 * Unsaved tests still show until the tab closes.
 *
 * @typedef {'saved' | 'newer' | 'unavailable'} SaveStatus
 */

/**
 * @typedef {{ valid: number, added: number, present: number, newer?: boolean }} ImportSummary
 *   valid:   results in the file
 *   added:   new ones now in your history
 *   present: ones you already had
 *   newer:   the file came from a newer version of embertype, so nothing was read
 *   (valid − added − present were older than the MAX_RESULTS tests that are kept)
 */

/**
 * @typedef {{
 *   results: import('../lib/history.js').TestResult[],
 *   status: SaveStatus,
 *   addResult: (result: import('../lib/history.js').TestResult) => void,
 *   clearHistory: () => void,
 *   importResults: (fileContents: unknown) => ImportSummary,
 * }} HistoryValue
 */

/** The export file format: the same envelope localStorage uses, so import can reuse its checks. */
export function exportHistory(results) {
  return JSON.stringify({ version: VERSION, results }, null, 2)
}

/** @type {import('react').Context<HistoryValue | null>} */
export const HistoryContext = createContext(null)

/** Saved results (oldest first), save status, and the actions. Use under <HistoryProvider>. */
export function useHistory() {
  const history = useContext(HistoryContext)
  if (!history) throw new Error('useHistory() must be used inside <HistoryProvider>')
  return history
}

/**
 * The well-formed results in an export file or saved envelope. Data can be from another
 * version, hand-edited or half-written, and one bad record shouldn't break the stats page.
 *
 * @param {unknown} saved the parsed JSON
 * @returns {import('../lib/history.js').TestResult[]}
 */
export function sanitizeHistory(saved) {
  return saved?.version === VERSION && Array.isArray(saved.results) ? saved.results.filter(isResult) : []
}

/**
 * The saved results as a small external store, for useSyncExternalStore.
 *
 * Three rules keep your history safe:
 *  1. Opening the app only reads. Nothing is written until something actually changes.
 *  2. Every change starts from what's saved right now, not from this tab's copy, so a test
 *     saved in another tab is never overwritten.
 *  3. Saved data is never thrown away silently: data from a newer version is left alone, and
 *     data that can't be fully read is copied to BACKUP_KEY before it's written over.
 *
 * @param {() => Storage} getStorage  a function, because merely touching localStorage can throw
 * @param {(message: string) => void} [warn]
 */
export function createHistoryStore(getStorage, warn = console.warn) {
  const listeners = new Set()
  const first = read()
  let snapshot = { results: first.results, status: first.status === 'ok' ? 'saved' : first.status }

  /**
   * What's saved, without changing anything. `backup` is set when part of it couldn't be
   * read: the text to keep before writing over it.
   *
   * @returns {{ status: 'ok' | 'newer' | 'unavailable', results: import('../lib/history.js').TestResult[],
   *             raw?: string, backup?: string }}
   */
  function read() {
    let raw
    try {
      raw = getStorage().getItem(HISTORY_KEY)
    } catch {
      return { status: 'unavailable', results: [] }
    }
    if (raw === null) return { status: 'ok', results: [] }

    let saved
    try {
      saved = JSON.parse(raw)
    } catch {
      return { status: 'ok', results: [], raw, backup: raw } // half-written or hand-edited
    }
    if (saved?.version > VERSION) return { status: 'newer', results: [] }
    if (saved?.version !== VERSION || !Array.isArray(saved.results)) return { status: 'ok', results: [], raw, backup: raw }

    const results = saved.results.filter(isResult)
    if (results.length === saved.results.length) return { status: 'ok', results, raw }
    const unreadable = saved.results.filter((result) => !isResult(result))
    return { status: 'ok', results, raw, backup: JSON.stringify({ version: VERSION, results: unreadable }) }
  }

  /** Save `results` in place of `stored` (what read() just returned). False if the browser refused. */
  function write(results, stored) {
    const json = JSON.stringify({ version: VERSION, results })
    if (json === stored.raw) return true
    try {
      const storage = getStorage()
      if (stored.backup !== undefined) {
        storage.setItem(BACKUP_KEY, stored.backup) // if this throws, the original stays untouched
        warn(`embertype: part of your saved history couldn't be read. It's copied to localStorage "${BACKUP_KEY}".`)
      }
      storage.setItem(HISTORY_KEY, json)
      return true
    } catch {
      return false
    }
  }

  function emit(next) {
    snapshot = next
    for (const listener of listeners) listener()
  }

  /**
   * Apply `change` to the saved results and save them. When saving isn't possible (or
   * allowed), the change is still shown in this tab.
   *
   * @param {(results: import('../lib/history.js').TestResult[]) => import('../lib/history.js').TestResult[]} change
   */
  function commit(change) {
    const finish = (results) => compactHistory(trimHistory(results, MAX_RESULTS), DETAILED_RESULTS)
    const stored = read()
    if (stored.status === 'ok') {
      const after = finish(change(stored.results))
      if (write(after, stored)) {
        emit({ results: after, status: 'saved' })
        return { before: stored.results, after }
      }
    }
    const before = snapshot.results
    const after = finish(change(before))
    emit({ results: after, status: stored.status === 'newer' ? 'newer' : 'unavailable' })
    return { before, after }
  }

  return {
    /** @param {() => void} listener */
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    getSnapshot: () => snapshot,

    /** Another tab saved: show what's there now. Only reads, so tabs never bounce writes back and forth. */
    reload() {
      const stored = read()
      emit(stored.status === 'ok' ? { results: stored.results, status: 'saved' } : { ...snapshot, status: stored.status })
    },

    /** Idempotent: StrictMode runs effects twice in development, and the result is matched by id. */
    addResult(result) {
      if (snapshot.results.some((saved) => saved.id === result.id)) return
      commit((results) => mergeResults(results, [result]))
    },

    clearHistory() {
      commit(() => [])
    },

    /**
     * An exported file goes through the same checks as saved data, then merges by id:
     * importing the same file twice adds nothing.
     *
     * @returns {ImportSummary}
     */
    importResults(fileContents) {
      if (fileContents?.version > VERSION) return { valid: 0, added: 0, present: 0, newer: true }
      const incoming = sanitizeHistory(fileContents)
      if (incoming.length === 0) return { valid: 0, added: 0, present: 0 }
      const { before, after } = commit((results) => mergeResults(results, incoming))
      const had = new Set(before.map((result) => result.id))
      const kept = new Set(after.map((result) => result.id))
      return {
        valid: incoming.length,
        added: incoming.filter((result) => !had.has(result.id) && kept.has(result.id)).length,
        present: incoming.filter((result) => had.has(result.id)).length,
      }
    },
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
    [r.punctuation, r.numbers, r.tech].every((flag) => flag === undefined || typeof flag === 'boolean') &&
    // Practice drills also record which keys they targeted.
    (r.targets === undefined || (Array.isArray(r.targets) && r.targets.every((c) => typeof c === 'string' && c.length === 1)))
  )
}
