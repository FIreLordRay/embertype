import { describe, expect, it } from 'vitest'
import { ENGLISH_200 } from '../data/english.js'
import { generateWords } from './words.js'

/** Small seeded PRNG (mulberry32), so "random" tests are repeatable. */
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('ENGLISH_200', () => {
  it('has 200 unique, lowercase, letters-only words', () => {
    expect(ENGLISH_200).toHaveLength(200)
    expect(new Set(ENGLISH_200).size).toBe(200)
    for (const word of ENGLISH_200) expect(word).toMatch(/^[a-z]+$/)
  })
})

describe('generateWords', () => {
  it('returns the requested number of words, all from the list', () => {
    const words = generateWords(ENGLISH_200, 50)
    expect(words).toHaveLength(50)
    for (const word of words) expect(ENGLISH_200).toContain(word)
  })

  it('never puts the same word twice in a row', () => {
    const words = generateWords(['a', 'b'], 1000, seeded(1))
    for (let i = 1; i < words.length; i++) expect(words[i]).not.toBe(words[i - 1])
  })

  it('is repeatable with a seeded rng', () => {
    expect(generateWords(ENGLISH_200, 20, seeded(42))).toEqual(generateWords(ENGLISH_200, 20, seeded(42)))
  })

  it('still terminates when the rng keeps returning the same number', () => {
    expect(generateWords(ENGLISH_200, 5, () => 0)).toEqual(['the', 'be', 'the', 'be', 'the'])
  })
})
