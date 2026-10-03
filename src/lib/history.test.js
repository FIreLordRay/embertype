import { describe, expect, it } from 'vitest'
import {
  createResult,
  filterByMode,
  formatDuration,
  keyStats,
  MODE_KEYS,
  movingAverage,
  personalBests,
  previousBest,
  summarize,
  timeAgo,
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

  it('knows every mode option', () => {
    expect(MODE_KEYS).toEqual(['time 15', 'time 30', 'time 60', 'words 10', 'words 25', 'words 50'])
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
