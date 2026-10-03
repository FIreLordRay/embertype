import { describe, expect, it } from 'vitest'
import { MAX_RESULTS, sanitizeHistory } from './history.js'

const valid = (id = 'a') => ({
  id,
  date: 1,
  mode: 'time',
  amount: 30,
  wpm: 60,
  raw: 64,
  accuracy: 96,
  errors: 2,
  ms: 30_000,
  keys: { e: [10, 1] },
})

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

  it('keeps quotes, lessons and tests with punctuation or numbers', () => {
    const kept = [
      { ...valid('q'), mode: 'quote', amount: 'long' },
      { ...valid('l'), mode: 'lesson', amount: 4 },
      { ...valid('p'), punctuation: true, numbers: false },
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

  it(`keeps only the newest ${MAX_RESULTS} results`, () => {
    const many = Array.from({ length: MAX_RESULTS + 5 }, (_, i) => valid(String(i)))
    const kept = sanitizeHistory({ version: 1, results: many })
    expect(kept).toHaveLength(MAX_RESULTS)
    expect(kept[0].id).toBe('5')
  })
})
