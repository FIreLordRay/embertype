import { describe, expect, it } from 'vitest'
import { ENGLISH_200 } from '../data/english.js'
import { decorateWords } from './decorate.js'
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

const plain = generateWords(ENGLISH_200, 2000, seeded(1))

describe('decorateWords', () => {
  it('leaves the words alone when both extras are off', () => {
    expect(decorateWords(plain, {})).toBe(plain)
  })

  it('turns about 1 word in 8 into a number, without leading zeros', () => {
    const out = decorateWords(plain, { numbers: true }, seeded(2))
    const numbers = out.filter((w) => /^\d+$/.test(w))
    expect(numbers.length / out.length).toBeGreaterThan(0.09)
    expect(numbers.length / out.length).toBeLessThan(0.15)
    for (const n of numbers) expect(n).toMatch(/^(0|[1-9]\d{0,3})$/)
  })

  it('writes sentences: capital first, ends with . ? or !, capital after each full stop', () => {
    const out = decorateWords(plain.slice(0, 300), { punctuation: true }, seeded(3))
    expect(out[0][0]).toMatch(/[A-Z]/)
    expect(out.at(-1)).toMatch(/[.?!]$/)
    for (let i = 1; i < out.length; i++) {
      if (/[.?!]$/.test(out[i - 1])) expect(out[i][0], `after "${out[i - 1]}"`).toMatch(/[A-Z"(]/)
    }
  })

  it('uses a good spread of punctuation, all of it typeable', () => {
    const text = decorateWords(plain, { punctuation: true, numbers: true }, seeded(4)).join(' ')
    for (const mark of [',', '.', '?', '!', ';', ':', '"', '(', "'", ' - ']) expect(text).toContain(mark)
    expect(text).toMatch(/^[\x20-\x7e]+$/)
    expect(text).not.toMatch(/ {2}/)
  })

  it('is repeatable with a seeded rng', () => {
    const a = decorateWords(plain.slice(0, 50), { punctuation: true, numbers: true }, seeded(5))
    const b = decorateWords(plain.slice(0, 50), { punctuation: true, numbers: true }, seeded(5))
    expect(a).toEqual(b)
  })
})
