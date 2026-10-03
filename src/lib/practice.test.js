import { describe, expect, it } from 'vitest'
import { PRACTICE_WORDS } from '../data/practiceWords.js'
import { generatePracticeWords, MAX_TARGETS, practiceTargets } from './practice.js'

/** Small seeded PRNG (mulberry32), so "random" tests are repeatable. */
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const result = (mode, keys) => ({ id: Math.random().toString(36), date: 0, mode, amount: 25, wpm: 50, raw: 52, accuracy: 96, errors: 1, ms: 30_000, keys })

describe('practiceTargets', () => {
  it('picks your worst keys from regular tests, worst first', () => {
    const history = [result('time', { a: [100, 2], b: [40, 8], c: [50, 5], d: [30, 6] })]
    expect(practiceTargets(history).map((t) => t.char)).toEqual(['b', 'd', 'c', 'a'])
  })

  it(`focuses on at most ${MAX_TARGETS} keys`, () => {
    const keys = Object.fromEntries('abcdefgh'.split('').map((c, i) => [c, [100, i + 1]]))
    expect(practiceTargets([result('words', keys)])).toHaveLength(MAX_TARGETS)
  })

  it("ignores drills: only regular tests decide what's weak", () => {
    const history = [result('time', { a: [50, 5] }), result('practice', { z: [50, 40] })]
    expect(practiceTargets(history).map((t) => t.char)).toEqual(['a'])
  })
})

describe('generatePracticeWords', () => {
  const targets = [
    { char: 'q', rate: 0.2 },
    { char: 'x', rate: 0.1 },
  ]

  it('returns the requested number of words, each containing a target key', () => {
    const words = generatePracticeWords(PRACTICE_WORDS, targets, 50, seeded(1))
    expect(words).toHaveLength(50)
    for (const word of words) expect(word).toMatch(/[qx]/)
  })

  it('drills keys in proportion to how often you miss them', () => {
    // "b" and "v" words never overlap here, so the split shows which key each slot picked.
    const list = ['bat', 'bob', 'bin', 'van', 'vet', 'vim']
    const words = generatePracticeWords(list, [{ char: 'b', rate: 0.3 }, { char: 'v', rate: 0.1 }], 4000, seeded(7))
    const bShare = words.filter((w) => w.startsWith('b')).length / words.length
    expect(bShare).toBeGreaterThan(0.72) // expected 0.75: b is missed 3× as often as v
    expect(bShare).toBeLessThan(0.78)
  })

  it('drills a weak space bar with short words', () => {
    const words = generatePracticeWords(PRACTICE_WORDS, [{ char: ' ', rate: 0.1 }], 40, seeded(3))
    for (const word of words) expect(word.length).toBeLessThanOrEqual(3)
  })

  it('never repeats a word twice in a row', () => {
    const words = generatePracticeWords(['jab', 'job', 'jam'], [{ char: 'j', rate: 0.1 }], 500, seeded(9))
    for (let i = 1; i < words.length; i++) expect(words[i]).not.toBe(words[i - 1])
  })

  it('skips keys no word contains, and falls back to ordinary words if nothing is left', () => {
    expect(generatePracticeWords(['cat', 'dog'], [{ char: '7', rate: 0.5 }], 5, seeded(2))).toHaveLength(5)
    expect(generatePracticeWords(['cat', 'dog'], [], 3, seeded(2))).toHaveLength(3)
  })

  it('still terminates when the rng keeps returning the same number', () => {
    expect(generatePracticeWords(['jab', 'job'], [{ char: 'j', rate: 0.1 }], 4, () => 0)).toEqual(['jab', 'job', 'jab', 'job'])
  })
})

describe('PRACTICE_WORDS', () => {
  it('is a clean list of unique, lowercase words', () => {
    expect(new Set(PRACTICE_WORDS).size).toBe(PRACTICE_WORDS.length)
    for (const word of PRACTICE_WORDS) expect(word).toMatch(/^[a-z]+$/)
  })

  it('has at least 15 words for every letter, so any key can be drilled', () => {
    for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
      expect(PRACTICE_WORDS.filter((w) => w.includes(letter)).length, letter).toBeGreaterThanOrEqual(15)
    }
  })
})
