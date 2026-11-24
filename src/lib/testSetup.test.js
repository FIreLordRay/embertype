import { describe, expect, it } from 'vitest'
import { QUOTES } from '../data/quotes.js'
import { TECH_WORDS } from '../data/tech.js'
import { knownLetters } from './lessons.js'
import { buildTest, MAX_WORDS_PER_SECOND } from './testSetup.js'

const regular = { id: 'r1', date: 0, mode: 'time', amount: 30, wpm: 72, raw: 75, accuracy: 95, errors: 2, ms: 30_000, keys: { k: [40, 8], v: [30, 3], e: [200, 2] } }

describe('buildTest', () => {
  it('time mode: enough words for any speed, and a time limit', () => {
    const test = buildTest({ mode: 'time', amount: 15 }, [])
    expect(test.words).toHaveLength(15 * MAX_WORDS_PER_SECOND)
    expect(test.timeLimitMs).toBe(15_000)
    expect(test.targets).toEqual([])
  })

  it('words mode: exactly that many words, no time limit', () => {
    const test = buildTest({ mode: 'words', amount: 25 }, [])
    expect(test.words).toHaveLength(25)
    expect(test.timeLimitMs).toBeNull()
  })

  it('mixes in punctuation and numbers when asked, for time and words tests only', () => {
    const words = buildTest({ mode: 'words', amount: 50, punctuation: true }, []).words
    expect(words[0][0]).toMatch(/[A-Z"(]/)
    expect(words.at(-1)).toMatch(/[.?!]$/)
    const quote = buildTest({ mode: 'quote', amount: 'short', punctuation: true, numbers: true }, [])
    expect(quote.extras).toEqual({}) // quotes are typed exactly as written
  })

  it('tech: words come from the tech list, for time and words tests only', () => {
    const test = buildTest({ mode: 'words', amount: 50, tech: true }, [])
    for (const word of test.words) expect(TECH_WORDS).toContain(word)
    expect(new Set(TECH_WORDS).size).toBe(500) // 500 different words
    for (const word of TECH_WORDS) expect(word).toMatch(/^[a-z]+$/)
    expect(test.extras.tech).toBe(true)
    expect(buildTest({ mode: 'quote', amount: 'short', tech: true }, []).extras).toEqual({})
  })

  it('quote mode: the words of one real quote, with its author', () => {
    const test = buildTest({ mode: 'quote', amount: 'medium' }, [])
    expect(QUOTES).toContainEqual(test.quote)
    expect(test.words.join(' ')).toBe(test.quote.text)
  })

  it('lesson mode: only letters learned so far', () => {
    const known = knownLetters(3)
    for (const word of buildTest({ mode: 'lesson', amount: 3 }, []).words) {
      expect([...word].every((c) => known.has(c))).toBe(true)
    }
  })

  it('practice mode: targets your weakest keys, and every word contains one', () => {
    const test = buildTest({ mode: 'practice', amount: 25 }, [regular])
    expect(test.targets.map((t) => t.char)).toEqual(['k', 'v', 'e']) // 20%, 10%, 1%
    expect(test.words).toHaveLength(25)
    for (const word of test.words) expect(word).toMatch(/[kve]/)
  })

  it('practice mode with no history yet: an ordinary drill, nothing targeted', () => {
    const test = buildTest({ mode: 'practice', amount: 10 }, [])
    expect(test.targets).toEqual([])
    expect(test.words).toHaveLength(10)
  })

  describe('race your best', () => {
    it('paces you at your best for exactly this test', () => {
      expect(buildTest({ mode: 'time', amount: 30, paceCaret: true }, [regular]).pace).toBe(72)
    })

    it("has nothing to race when it's off, there's no best yet, or the extras differ", () => {
      expect(buildTest({ mode: 'time', amount: 30, paceCaret: false }, [regular]).pace).toBeNull()
      expect(buildTest({ mode: 'time', amount: 60, paceCaret: true }, [regular]).pace).toBeNull()
      expect(buildTest({ mode: 'time', amount: 30, punctuation: true, paceCaret: true }, [regular]).pace).toBeNull()
    })

    it("doesn't pace training, which has no bests", () => {
      expect(buildTest({ mode: 'practice', amount: 25, paceCaret: true }, [regular]).pace).toBeNull()
    })
  })
})
