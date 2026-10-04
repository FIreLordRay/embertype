import { describe, expect, it } from 'vitest'
import {
  compactHistory,
  createResult,
  extrasLabel,
  filterByMode,
  formatDuration,
  keyStats,
  keyTotalsByKey,
  mergeResults,
  MODE_KEYS,
  movingAverage,
  personalBests,
  previousBest,
  summarize,
  testLabel,
  timeAgo,
  trimHistory,
} from './history.js'
import { createInitialState } from './typingEngine.js'
import { keys, play } from './testing.js'

/** A saved result with sensible defaults; override what a test cares about. */
const result = (overrides = {}) => ({
  id: Math.random().toString(36).slice(2),
  date: 0,
  mode: 'time',
  amount: 30,
  wpm: 50,
  raw: 55,
  accuracy: 95,
  errors: 3,
  ms: 30_000,
  keys: {},
  ...overrides,
})

describe('createResult', () => {
  // Target "the cat": t ✓, e ✗ (expected h), h ✗ (expected e), ⌫ ⌫, h ✓, e ✓, ' ' ✓, c ✓, a ✓, t ✓
  const done = play(createInitialState({ words: ['the', 'cat'], id: 'test-1' }), keys('teh⌫⌫he cat', 0, 500))
  const saved = createResult({
    id: done.id,
    date: 123,
    mode: 'words',
    amount: 10,
    ...done,
    elapsedMs: done.endedAt - done.startedAt,
  })

  it('saves the headline numbers with the test', () => {
    expect(saved).toMatchObject({ id: 'test-1', date: 123, mode: 'words', amount: 10, errors: 2, ms: 5000 })
    expect(saved.accuracy).toBeCloseTo((7 / 9) * 100) // 7 of 9 keystrokes right
  })

  it('counts attempts and misses per expected key', () => {
    expect(saved.keys).toEqual({ t: [2, 0], h: [2, 1], e: [2, 1], ' ': [1, 0], c: [1, 0], a: [1, 0] })
  })

  it('remembers which keys a practice drill targeted, and adds nothing for regular tests', () => {
    const drill = createResult({ id: 'p', date: 0, mode: 'practice', amount: 10, ...done, elapsedMs: 5000, targets: ['h', 'e'] })
    expect(drill.targets).toEqual(['h', 'e'])
    expect(saved).not.toHaveProperty('targets')
  })

  it('skips tests with less than one word of correct typing', () => {
    const accidental = play(createInitialState({ words: ['the', 'cat'] }), keys('th', 0, 100))
    expect(createResult({ id: 'x', date: 0, mode: 'time', amount: 15, ...accidental, elapsedMs: 15_000 })).toBeNull()
  })
})

describe('summarize', () => {
  it('reports totals, the best test, and recent vs previous averages', () => {
    const history = Array.from({ length: 20 }, (_, i) => result({ wpm: 40 + i, accuracy: 90, ms: 15_000 }))
    const summary = summarize(history)
    expect(summary.tests).toBe(20)
    expect(summary.totalMs).toBe(300_000)
    expect(summary.best.wpm).toBe(59)
    expect(summary.recentWpm).toBeCloseTo(54.5) // mean of 50…59
    expect(summary.previousWpm).toBeCloseTo(44.5) // mean of 40…49
    expect(summary.recentAccuracy).toBe(90)
  })

  it('has no trend until there are at least 3 earlier tests to compare with', () => {
    expect(summarize(Array.from({ length: 12 }, () => result())).previousWpm).toBeNull()
    expect(summarize(Array.from({ length: 13 }, () => result())).previousWpm).toBe(50)
  })

  it('handles an empty history', () => {
    expect(summarize([])).toMatchObject({ tests: 0, totalMs: 0, best: null, recentWpm: 0 })
  })
})

describe('personalBests / previousBest', () => {
  const history = [
    result({ id: 'a', amount: 30, wpm: 60 }),
    result({ id: 'b', amount: 30, wpm: 72 }),
    result({ id: 'c', amount: 30, wpm: 72 }), // ties don't steal the title
    result({ id: 'd', mode: 'words', amount: 25, wpm: 65 }),
  ]

  it('keeps the best result and a test count for each mode', () => {
    const bests = personalBests(history)
    expect(bests.get('time 30')).toMatchObject({ best: { id: 'b' }, count: 3 })
    expect(bests.get('words 25')).toMatchObject({ best: { id: 'd' }, count: 1 })
    expect(bests.has('time 60')).toBe(false)
  })

  it('keeps separate bests for punctuation and numbers', () => {
    const bests = personalBests([
      result({ id: 'plain', wpm: 70 }),
      result({ id: 'punct', wpm: 90, punctuation: true }),
      result({ id: 'both', wpm: 50, punctuation: true, numbers: true }),
    ])
    expect(bests.get('time 30')).toMatchObject({ best: { id: 'plain' }, count: 1 }) // not beaten by 'punct'
    expect(bests.get('time 30 + punctuation')).toMatchObject({ best: { id: 'punct' } })
    expect(bests.get('time 30 + punctuation + numbers')).toMatchObject({ best: { id: 'both' } })
  })

  it('finds the best before a given test, ignoring the test itself', () => {
    expect(previousBest(history, 'time 30', 'c')).toBe(72)
    expect(previousBest(history, 'words 25', 'd')).toBeNull() // first test in that mode
  })
})

describe('keyStats', () => {
  it('ranks keys by miss rate, not by raw miss count', () => {
    const history = [result({ keys: { e: [200, 10], q: [20, 4], z: [5, 5] } })]
    // e has the most misses (10) but only a 5% rate; q is missed 20% of the time;
    // z has too few attempts to judge.
    expect(keyStats(history).map((k) => [k.char, k.rate])).toEqual([
      ['q', 0.2],
      ['e', 0.05],
    ])
  })

  it('adds attempts and misses up across tests', () => {
    const history = [result({ keys: { r: [15, 1] } }), result({ keys: { r: [15, 2] } })]
    expect(keyStats(history)).toEqual([{ char: 'r', attempts: 30, misses: 3, rate: 0.1 }])
  })
})

describe('movingAverage', () => {
  it('averages the trailing window, using what exists at the start', () => {
    expect(movingAverage([10, 20, 30, 40], 2)).toEqual([10, 15, 25, 35])
  })
})

describe('filterByMode', () => {
  it('keeps one mode, or every regular test for "all"', () => {
    const history = [result({ amount: 15 }), result({ amount: 30 })]
    expect(filterByMode(history, 'time 15')).toHaveLength(1)
    expect(filterByMode(history, 'all')).toHaveLength(2)
  })

  it('keeps practice drills out of "all" and shows them under "practice"', () => {
    const history = [result({ id: 't' }), result({ id: 'p1', mode: 'practice', amount: 25 }), result({ id: 'p2', mode: 'practice', amount: 10 })]
    expect(filterByMode(history, 'all').map((r) => r.id)).toEqual(['t'])
    expect(filterByMode(history, 'practice').map((r) => r.id)).toEqual(['p1', 'p2'])
  })

  it('knows every regular test option', () => {
    expect(MODE_KEYS).toEqual([
      'time 15', 'time 30', 'time 60',
      'words 10', 'words 25', 'words 50',
      'quote short', 'quote medium', 'quote long',
    ])
  })
})

describe('formatDuration', () => {
  it.each([
    [45_000, '45s'],
    [12 * 60_000, '12m'],
    [65 * 60_000, '1h 05m'],
  ])('%i ms → %s', (ms, text) => expect(formatDuration(ms)).toBe(text))
})

describe('timeAgo', () => {
  const now = Date.UTC(2026, 9, 1, 12)
  it.each([
    [now - 10_000, 'just now'],
    [now - 5 * 60_000, '5 minutes ago'],
    [now - 3 * 3_600_000, '3 hours ago'],
    [now - 24 * 3_600_000, 'yesterday'],
    [now - 4 * 86_400_000, '4 days ago'],
  ])('%i → %s', (date, text) => expect(timeAgo(date, now)).toBe(text))
})

describe('extras and training', () => {
  it('saves the punctuation and numbers settings only when they are on', () => {
    const done = play(createInitialState({ words: ['the', 'cat'] }), keys('the cat', 0, 200))
    const base = { id: 'x', date: 0, mode: 'words', amount: 10, ...done, elapsedMs: 1200 }
    expect(createResult({ ...base, punctuation: true })).toMatchObject({ punctuation: true })
    expect(createResult({ ...base, punctuation: true })).not.toHaveProperty('numbers')
    expect(createResult(base)).not.toHaveProperty('punctuation')
  })

  it('only compares personal bests with the same punctuation and numbers settings', () => {
    const history = [result({ id: 'plain', wpm: 80 }), result({ id: 'punct', wpm: 60, punctuation: true })]
    expect(previousBest(history, 'time 30', 'new')).toBe(80)
    expect(previousBest(history, 'time 30', 'new', { punctuation: true })).toBe(60)
    expect(previousBest(history, 'time 30', 'new', { numbers: true })).toBeNull()
  })

  it('keeps lessons out of "all", with their own filter', () => {
    const history = [result({ id: 't' }), result({ id: 'l', mode: 'lesson', amount: 4 }), result({ id: 'q', mode: 'quote', amount: 'short' })]
    expect(filterByMode(history, 'all').map((r) => r.id)).toEqual(['t', 'q'])
    expect(filterByMode(history, 'lessons').map((r) => r.id)).toEqual(['l'])
  })

  it('lists quotes among the regular test modes', () => {
    expect(MODE_KEYS).toContain('quote long')
    expect(MODE_KEYS.some((key) => key.startsWith('practice') || key.startsWith('lesson'))).toBe(false)
  })
})

describe('keyTotalsByKey', () => {
  it('adds capitals and symbols to the physical key that types them', () => {
    const history = [result({ keys: { a: [10, 1], A: [5, 2], '/': [3, 0], '?': [2, 1], é: [4, 4] } })]
    const totals = keyTotalsByKey(history)
    expect(totals.get('a')).toEqual({ key: 'a', attempts: 15, misses: 3, rate: 0.2 })
    expect(totals.get('/')).toEqual({ key: '/', attempts: 5, misses: 1, rate: 0.2 })
    expect(totals.has('é')).toBe(false) // not on a US keyboard
  })
})

describe('testLabel / extrasLabel', () => {
  it('names the test with its extras', () => {
    expect(testLabel(result())).toBe('time 30')
    expect(testLabel(result({ mode: 'words', amount: 25, punctuation: true }))).toBe('words 25 + punctuation')
    expect(testLabel(result({ punctuation: true, numbers: true }))).toBe('time 30 + punctuation + numbers')
    expect(extrasLabel({ punctuation: true, numbers: true })).toBe('punctuation and numbers')
    expect(extrasLabel({})).toBe('')
  })
})

describe('mergeResults', () => {
  it('adds only new results, oldest first', () => {
    const existing = [result({ id: 'a', date: 1 }), result({ id: 'b', date: 3 })]
    const incoming = [result({ id: 'b', date: 3 }), result({ id: 'c', date: 2 }), result({ id: 'd', date: 4 })]
    expect(mergeResults(existing, incoming).map((r) => r.id)).toEqual(['a', 'c', 'b', 'd'])
  })

  it('changes nothing when the same file is imported twice', () => {
    const existing = [result({ id: 'a', date: 1 })]
    expect(mergeResults(existing, existing)).toEqual(existing)
  })
})

describe('trimHistory', () => {
  const DAY = 86_400_000
  const noon = new Date(2026, 0, 1, 12).getTime()

  it('leaves a history under the limit alone', () => {
    const history = [result({ id: 'a' }), result({ id: 'b' })]
    expect(trimHistory(history, 5)).toBe(history)
  })

  it('drops the oldest tests first, but never a best, a lesson pass or the last test of a day', () => {
    const history = [
      result({ id: 'best', date: noon, wpm: 99 }), // best time 30: kept
      result({ id: 'punct-best', date: noon + 1, wpm: 40, punctuation: true }), // best with punctuation: kept
      result({ id: 'pass', date: noon + 2, mode: 'lesson', amount: 3, wpm: 20, accuracy: 97 }), // first pass, lesson best: kept
      result({ id: 'old-1', date: noon + 3 }),
      result({ id: 'old-2', date: noon + 4 }),
      result({ id: 'day-1', date: noon + 5 }), // last test on 1 Jan: kept
      result({ id: 'new-1', date: noon + DAY }),
      result({ id: 'new-2', date: noon + DAY + 1 }), // last test on 2 Jan: kept
    ]
    expect(trimHistory(history, 6).map((r) => r.id)).toEqual(['best', 'punct-best', 'pass', 'day-1', 'new-1', 'new-2'])
  })

  it('cuts even kept tests, oldest first, when they alone are over the limit', () => {
    const days = Array.from({ length: 5 }, (_, i) => result({ id: `day-${i}`, date: noon + i * DAY }))
    expect(trimHistory(days, 3).map((r) => r.id)).toEqual(['day-2', 'day-3', 'day-4'])
  })
})

describe('compactHistory', () => {
  it('keeps per-key counts only on the newest tests', () => {
    const history = [result({ id: 'a', keys: { e: [5, 1] } }), result({ id: 'b', keys: { e: [6, 0] } }), result({ id: 'c', keys: { e: [7, 2] } })]
    const compact = compactHistory(history, 2)
    expect(compact.map((r) => r.keys)).toEqual([{}, { e: [6, 0] }, { e: [7, 2] }])
    expect(compact[2]).toBe(history[2]) // untouched tests are the same objects
    expect(history[0].keys).toEqual({ e: [5, 1] }) // the input isn't changed
  })
})
