import { describe, expect, it, vi } from 'vitest'
import { BACKUP_KEY, createHistoryStore, DETAILED_RESULTS, HISTORY_KEY, MAX_RESULTS, sanitizeHistory } from './history.js'

const valid = (id = 'a', date = 1) => ({
  id,
  date,
  mode: 'time',
  amount: 30,
  wpm: 60,
  raw: 64,
  accuracy: 96,
  errors: 2,
  ms: 30_000,
  keys: { e: [10, 1] },
})

const saved = (results, version = 1) => JSON.stringify({ version, results })

/** An in-memory localStorage that records every write. */
function memoryStorage(entries = {}) {
  const data = new Map(Object.entries(entries))
  return {
    data,
    writes: [],
    getItem(key) {
      return data.has(key) ? data.get(key) : null
    },
    setItem(key, value) {
      this.writes.push(key)
      data.set(key, String(value))
    },
    removeItem(key) {
      data.delete(key)
    },
  }
}

const storeFor = (storage) => createHistoryStore(() => storage, vi.fn())
const ids = (store) => store.getSnapshot().results.map((r) => r.id)

describe('sanitizeHistory', () => {
  it('keeps well-formed results', () => {
    expect(sanitizeHistory({ version: 1, results: [valid()] })).toEqual([valid()])
  })

  it('returns nothing for missing, foreign or unknown-version data', () => {
    expect(sanitizeHistory(null)).toEqual([])
    expect(sanitizeHistory([valid()])).toEqual([]) // no version envelope
    expect(sanitizeHistory({ version: 99, results: [valid()] })).toEqual([])
  })

  it('keeps practice drills with the keys they targeted', () => {
    const drill = { ...valid('p'), mode: 'practice', amount: 25, targets: ['b', ' '] }
    expect(sanitizeHistory({ version: 1, results: [drill] })).toEqual([drill])
  })

  it('keeps quotes, lessons, tests with punctuation or numbers, and compacted tests', () => {
    const kept = [
      { ...valid('q'), mode: 'quote', amount: 'long' },
      { ...valid('l'), mode: 'lesson', amount: 4 },
      { ...valid('p'), punctuation: true, numbers: false },
      { ...valid('o'), keys: {} },
    ]
    expect(sanitizeHistory({ version: 1, results: kept })).toEqual(kept)
  })

  it('drops records with a broken amount or extras flag', () => {
    const broken = [{ ...valid('a'), amount: '' }, { ...valid('b'), amount: null }, { ...valid('c'), punctuation: 'yes' }]
    expect(sanitizeHistory({ version: 1, results: broken })).toEqual([])
  })

  it('drops individual broken records but keeps the rest', () => {
    const broken = [
      { ...valid('b'), wpm: 'fast' },
      { ...valid('c'), mode: 'toString' },
      { ...valid('d'), keys: { e: 'oops' } },
      { ...valid('e'), mode: 'practice', targets: 'bv' },
      null,
    ]
    expect(sanitizeHistory({ version: 1, results: [valid('a'), ...broken] }).map((r) => r.id)).toEqual(['a'])
  })
})

describe('createHistoryStore', () => {
  it('only reads when the app opens', () => {
    const storage = memoryStorage({ [HISTORY_KEY]: JSON.stringify({ version: 1, results: [valid('a')] }, null, 2) })
    const store = storeFor(storage)
    expect(ids(store)).toEqual(['a'])
    expect(store.getSnapshot().status).toBe('saved')
    expect(storage.writes).toEqual([])
  })

  it('saves a new result, once, even if it is added twice', () => {
    const storage = memoryStorage()
    const store = storeFor(storage)
    store.addResult(valid('a'))
    store.addResult(valid('a')) // StrictMode runs the saving effect twice in development
    expect(JSON.parse(storage.data.get(HISTORY_KEY)).results.map((r) => r.id)).toEqual(['a'])
    expect(storage.writes).toEqual([HISTORY_KEY])
  })

  it("starts every change from what's saved, so another tab's tests aren't overwritten", () => {
    const storage = memoryStorage({ [HISTORY_KEY]: saved([valid('a', 1)]) })
    const store = storeFor(storage)
    storage.data.set(HISTORY_KEY, saved([valid('a', 1), valid('b', 2)])) // another tab saves 'b'
    store.addResult(valid('c', 3))
    expect(JSON.parse(storage.data.get(HISTORY_KEY)).results.map((r) => r.id)).toEqual(['a', 'b', 'c'])
    expect(ids(store)).toEqual(['a', 'b', 'c'])
  })

  it('follows another tab on reload, without writing', () => {
    const storage = memoryStorage({ [HISTORY_KEY]: saved([valid('a')]) })
    const store = storeFor(storage)
    const listener = vi.fn()
    store.subscribe(listener)
    storage.data.set(HISTORY_KEY, saved([valid('a'), valid('b', 2)]))
    store.reload()
    expect(ids(store)).toEqual(['a', 'b'])
    expect(listener).toHaveBeenCalled()
    expect(storage.writes).toEqual([])
  })

  it('never writes over history saved by a newer version', () => {
    const newer = saved([{ id: 'x', shape: 'unknown to this version' }], 2)
    const storage = memoryStorage({ [HISTORY_KEY]: newer })
    const store = storeFor(storage)
    expect(store.getSnapshot()).toEqual({ results: [], status: 'newer' })
    store.addResult(valid('a'))
    store.clearHistory()
    expect(storage.data.get(HISTORY_KEY)).toBe(newer)
    expect(storage.writes).toEqual([])
  })

  it('keeps showing its tests, unsaved, when a newer version takes over in another tab', () => {
    const storage = memoryStorage({ [HISTORY_KEY]: saved([valid('a')]) })
    const store = storeFor(storage)
    storage.data.set(HISTORY_KEY, saved([], 2))
    store.reload()
    expect(store.getSnapshot()).toMatchObject({ status: 'newer', results: [{ id: 'a' }] })
    store.addResult(valid('b', 2))
    expect(ids(store)).toEqual(['a', 'b'])
    expect(storage.writes).toEqual([])
  })

  it('backs up unreadable history before writing over it', () => {
    const storage = memoryStorage({ [HISTORY_KEY]: '{"version":1,"results":[{"id":' })
    const warn = vi.fn()
    const store = createHistoryStore(() => storage, warn)
    expect(store.getSnapshot()).toEqual({ results: [], status: 'saved' })
    store.addResult(valid('a'))
    expect(storage.data.get(BACKUP_KEY)).toBe('{"version":1,"results":[{"id":')
    expect(JSON.parse(storage.data.get(HISTORY_KEY)).results.map((r) => r.id)).toEqual(['a'])
    expect(warn).toHaveBeenCalledOnce()
  })

  it("backs up just the records it can't read, and keeps the rest", () => {
    const future = { ...valid('z'), mode: 'zen' } // a mode this version doesn't know
    const storage = memoryStorage({ [HISTORY_KEY]: saved([valid('a'), future]) })
    const store = storeFor(storage)
    expect(ids(store)).toEqual(['a'])
    store.addResult(valid('b', 2))
    expect(JSON.parse(storage.data.get(BACKUP_KEY)).results).toEqual([future])
    expect(JSON.parse(storage.data.get(HISTORY_KEY)).results.map((r) => r.id)).toEqual(['a', 'b'])
  })

  it("leaves the original untouched if the backup can't be written", () => {
    const storage = memoryStorage({ [HISTORY_KEY]: 'not json' })
    storage.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError')
    }
    const store = storeFor(storage)
    store.addResult(valid('a'))
    expect(storage.data.get(HISTORY_KEY)).toBe('not json')
    expect(store.getSnapshot()).toMatchObject({ status: 'unavailable', results: [{ id: 'a' }] })
  })

  it('keeps working in memory when storage is blocked or full', () => {
    const blocked = createHistoryStore(() => {
      throw new DOMException('denied', 'SecurityError')
    }, vi.fn())
    expect(blocked.getSnapshot()).toEqual({ results: [], status: 'unavailable' })
    blocked.addResult(valid('a'))
    blocked.addResult(valid('b', 2))
    expect(ids(blocked)).toEqual(['a', 'b'])

    const full = memoryStorage()
    full.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError')
    }
    const store = storeFor(full)
    store.addResult(valid('a'))
    store.addResult(valid('b', 2))
    expect(store.getSnapshot()).toMatchObject({ status: 'unavailable' })
    expect(ids(store)).toEqual(['a', 'b']) // the first unsaved test isn't lost
  })

  it('clears the history', () => {
    const storage = memoryStorage({ [HISTORY_KEY]: saved([valid('a')]) })
    const store = storeFor(storage)
    store.clearHistory()
    expect(JSON.parse(storage.data.get(HISTORY_KEY)).results).toEqual([])
    expect(ids(store)).toEqual([])
  })

  it('imports a file by id, and says what really happened', () => {
    const storage = memoryStorage({ [HISTORY_KEY]: saved([valid('a', 1)]) })
    const store = storeFor(storage)
    const file = { version: 1, results: [valid('a', 1), valid('b', 2), { broken: true }] }
    expect(store.importResults(file)).toEqual({ valid: 2, added: 1, present: 1 })
    expect(store.importResults(file)).toEqual({ valid: 2, added: 0, present: 2 }) // twice adds nothing
    expect(ids(store)).toEqual(['a', 'b'])
  })

  it("doesn't count imported tests older than the ones kept as added", () => {
    const DAY = 86_400_000
    const day = new Date(2026, 0, 1, 12).getTime()
    // A full history, a few tests a day (most of them can be trimmed)…
    const full = Array.from({ length: MAX_RESULTS }, (_, i) => valid(`k${i}`, day + Math.floor(i / 4) * DAY + i))
    const store = storeFor(memoryStorage({ [HISTORY_KEY]: saved(full) }))
    // …and a file of 5 slower tests from the morning of the very first day (slower, so none
    // of them is a personal best, which would be kept).
    const old = Array.from({ length: 5 }, (_, i) => ({ ...valid(`old${i}`, day - 3_600_000 + i), wpm: 40 }))
    expect(store.importResults({ version: 1, results: old })).toEqual({ valid: 5, added: 0, present: 0 })
    expect(store.getSnapshot().results).toHaveLength(MAX_RESULTS)
  })

  it('reports a file from a newer version instead of reading it', () => {
    const store = storeFor(memoryStorage())
    expect(store.importResults({ version: 2, results: [valid('a')] })).toMatchObject({ valid: 0, newer: true })
    expect(ids(store)).toEqual([])
  })

  it(`keeps at most ${MAX_RESULTS} tests, per-key counts on the newest ${DETAILED_RESULTS}`, () => {
    const many = Array.from({ length: MAX_RESULTS + 10 }, (_, i) => valid(`r${i}`, i))
    const storage = memoryStorage()
    const store = storeFor(storage)
    store.importResults({ version: 1, results: many })
    const kept = JSON.parse(storage.data.get(HISTORY_KEY)).results
    expect(kept).toHaveLength(MAX_RESULTS)
    expect(kept.filter((r) => Object.keys(r.keys).length > 0)).toHaveLength(DETAILED_RESULTS)
    expect(kept.at(-1).id).toBe(`r${MAX_RESULTS + 9}`) // the newest are kept
  })
})
