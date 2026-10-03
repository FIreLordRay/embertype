import { describe, expect, it } from 'vitest'
import { accuracy, buildTimeline, completedWords, computeStats, missedKeys, wpm } from './metrics.js'
import { createInitialState } from './typingEngine.js'
import { keys, play } from './testing.js'

describe('wpm', () => {
  it('is (characters / 5) per minute', () => {
    expect(wpm(250, 60_000)).toBe(50) // 50 standard words in a minute
    expect(wpm(250, 30_000)).toBe(100) // same words in half the time
    expect(wpm(5, 1_000)).toBe(60) // one word per second
  })

  it('is 0 when no time has passed, instead of dividing by zero', () => {
    expect(wpm(10, 0)).toBe(0)
  })
})

describe('accuracy', () => {
  it('is correct keystrokes / total keystrokes × 100', () => {
    expect(accuracy(45, 50)).toBe(90)
  })

  it('is 100 before anything has been typed', () => {
    expect(accuracy(0, 0)).toBe(100)
  })
})

describe('computeStats', () => {
  // Target "the cat". Type t ✓, e ✗, h ✗, fix both with ⌫⌫, then h ✓ e ✓. One key per second.
  const fixed = play(createInitialState({ words: ['the', 'cat'] }), keys('teh⌫⌫he', 0, 1000))

  it('credits a fixed mistake in wpm, but not in accuracy', () => {
    const stats = computeStats({ ...fixed, elapsedMs: 6000 })
    expect(stats.correctChars).toBe(3) // "the" is correct now…
    expect(stats.wpm).toBeCloseTo(6) // …so wpm counts 3 chars: (3 / 5) / 0.1 min
    expect(stats.keystrokes).toBe(5) // Backspace isn't a keystroke for accuracy
    expect(stats.errors).toBe(2) // …but the two wrong keys still happened
    expect(stats.accuracy).toBe(60) // 3 of 5 keystrokes were right
  })

  it('counts every keystroke in raw wpm, deleted mistakes included', () => {
    expect(computeStats({ ...fixed, elapsedMs: 6000 }).raw).toBeCloseTo(10) // (5 / 5) / 0.1 min
  })

  it('does not credit uncorrected mistakes in wpm', () => {
    const sloppy = play(createInitialState({ words: ['the', 'cat'] }), keys('txe', 0, 1000))
    const stats = computeStats({ ...sloppy, elapsedMs: 2000 })
    expect(stats.correctChars).toBe(2)
    expect(stats.incorrectChars).toBe(1)
    expect(stats.wpm).toBeCloseTo(wpm(2, 2000))
    expect(stats.raw).toBeCloseTo(wpm(3, 2000))
  })
})

describe('buildTimeline', () => {
  // Target "the cat", finished at exactly t = 3000ms with a mistake in seconds 1 and 3.
  const steps = [
    ['t', 0], ['x', 500], ['⌫', 900], // second 1: one mistake, fixed
    ['h', 1200], ['e', 1300], [' ', 1900], // second 2: clean
    ['c', 2100], ['q', 2200], ['⌫', 2400], ['a', 2500], ['t', 3000], // second 3: one mistake
  ]
  const done = play(createInitialState({ words: ['the', 'cat'] }), steps)
  const elapsedMs = done.endedAt - done.startedAt
  const timeline = buildTimeline({ ...done, elapsedMs })

  it('has one point per second of the test', () => {
    expect(done.status).toBe('finished')
    expect(timeline.map((p) => p.second)).toEqual([1, 2, 3])
  })

  it('puts each mistake in the second it happened', () => {
    expect(timeline.map((p) => p.errors)).toEqual([1, 0, 1])
  })

  it('replays deletes, so wpm reflects the text as it stood at each second', () => {
    expect(timeline[0].wpm).toBeCloseTo(12) // "t" correct after 1s
    expect(timeline[0].raw).toBeCloseTo(24) // 2 keystrokes after 1s (the deleted x counts)
    expect(timeline[1].wpm).toBeCloseTo(24) // "the " correct after 2s
    expect(timeline[1].raw).toBeCloseTo(30) // 5 keystrokes after 2s
  })

  it('includes the final keystroke, so the last point equals the final result exactly', () => {
    const final = computeStats({ ...done, elapsedMs })
    expect(timeline.at(-1).wpm).toBe(final.wpm) // ≈ 28
    expect(timeline.at(-1).raw).toBe(final.raw) // ≈ 36
  })
})

describe('missedKeys', () => {
  it('ranks the expected characters you missed most', () => {
    const log = [
      { type: 'char', t: 0, expected: 'e', actual: 'r' },
      { type: 'char', t: 1, expected: 'e', actual: 'w' },
      { type: 'char', t: 2, expected: 'h', actual: 'j' },
      { type: 'char', t: 3, expected: 'a', actual: 'a' }, // correct: not a miss
    ]
    expect(missedKeys(log)).toEqual([
      { char: 'e', count: 2 },
      { char: 'h', count: 1 },
    ])
  })
})

describe('completedWords', () => {
  it('counts the spaces before the cursor', () => {
    expect(completedWords('the cat sat', 0)).toBe(0)
    expect(completedWords('the cat sat', 8)).toBe(2)
  })
})
