import { describe, expect, it } from 'vitest'
import { QUOTES } from '../data/quotes.js'
import { pickQuote, quoteLength } from './quotes.js'

describe('QUOTES', () => {
  it('only uses characters you can type on a plain keyboard, single-spaced', () => {
    for (const { text, author } of QUOTES) {
      expect(text, text).toMatch(/^[\x20-\x7e]+$/) // printable ASCII: no curly quotes or long dashes
      expect(text, text).not.toMatch(/ {2}|^ | $/)
      expect(author).toBeTruthy()
    }
  })

  it('has no duplicates', () => {
    expect(new Set(QUOTES.map((q) => q.text)).size).toBe(QUOTES.length)
  })

  it('has plenty of quotes in every length group', () => {
    for (const length of ['short', 'medium', 'long']) {
      expect(QUOTES.filter((q) => quoteLength(q.text) === length).length, length).toBeGreaterThanOrEqual(8)
    }
  })
})

describe('pickQuote', () => {
  it('returns a quote of the requested length', () => {
    for (const length of ['short', 'medium', 'long']) {
      for (let seed = 0; seed < 10; seed++) expect(quoteLength(pickQuote(length, () => seed / 10).text)).toBe(length)
    }
  })
})
