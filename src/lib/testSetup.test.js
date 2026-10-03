import { describe, expect, it } from 'vitest'
import { buildTest, MAX_WORDS_PER_SECOND } from './testSetup.js'

const regular = { id: 'r1', date: 0, mode: 'time', amount: 30, wpm: 50, raw: 52, accuracy: 95, errors: 2, ms: 30_000, keys: { k: [40, 8], v: [30, 3], e: [200, 2] } }

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
})
