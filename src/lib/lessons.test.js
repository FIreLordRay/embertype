import { describe, expect, it } from 'vitest'
import { LESSON_LENGTH, LESSONS, PASS_ACCURACY, PASS_WPM } from '../config/lessons.js'
import { knownLetters, lessonPassed, lessonProgress, lessonWords, nextLessonNumber } from './lessons.js'

/** Small seeded PRNG (mulberry32), so "random" tests are repeatable. */
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const usesOnly = (word, letters) => [...word].every((c) => letters.has(c))

describe('the course', () => {
  it('teaches every letter of the alphabet exactly once', () => {
    const taught = LESSONS.flatMap((lesson) => [...lesson.keys])
    expect(taught.sort().join('')).toBe('abcdefghijklmnopqrstuvwxyz')
  })

  it('knows the letters learned so far', () => {
    expect([...knownLetters(1)].sort()).toEqual(['f', 'j'])
    expect([...knownLetters(3)].sort()).toEqual(['d', 'f', 'j', 'k', 'l', 's'])
    expect(knownLetters(LESSONS.length).size).toBe(26)
  })
})

describe('lessonWords', () => {
  it('only ever uses letters learned so far', () => {
    for (let n = 1; n <= LESSONS.length; n++) {
      const known = knownLetters(n)
      const words = lessonWords(n, seeded(n))
      expect(words).toHaveLength(LESSON_LENGTH)
      for (const word of words) expect(usesOnly(word, known), `lesson ${n}: "${word}"`).toBe(true)
    }
  })

  it('drills just f and j in the first lesson', () => {
    expect(lessonWords(1, seeded(1)).join('')).toMatch(/^[fj]+$/)
  })

  it('focuses on the new keys: most words in lesson 8 contain t or y', () => {
    const words = lessonWords(8, seeded(8), 200)
    const withNew = words.filter((w) => /[ty]/.test(w)).length
    expect(withNew / words.length).toBeGreaterThan(0.6)
  })

  it('mixes in a few real words once there are some (lesson 4)', () => {
    const words = lessonWords(4, seeded(4), 100)
    const real = words.filter((w) => ['a', 'as', 'all', 'ask', 'add', 'fall'].includes(w))
    expect(real.length).toBeGreaterThan(20)
    expect(real.length).toBeLessThan(80)
  })

  it('uses real words in the review lesson', () => {
    for (const word of lessonWords(LESSONS.length, seeded(3))) expect(word).toMatch(/^[a-z]+$/)
  })
})

describe('progress', () => {
  const result = (lesson, wpm, accuracy) => ({ id: `${lesson}-${wpm}-${accuracy}`, mode: 'lesson', amount: lesson, wpm, accuracy })

  it(`passes with ${PASS_ACCURACY}% accuracy and ${PASS_WPM} wpm`, () => {
    expect(lessonPassed({ accuracy: PASS_ACCURACY, wpm: PASS_WPM })).toBe(true)
    expect(lessonPassed({ accuracy: PASS_ACCURACY - 0.1, wpm: 80 })).toBe(false) // fast but sloppy
    expect(lessonPassed({ accuracy: 100, wpm: PASS_WPM - 1 })).toBe(false)
  })

  it('works out which lessons are passed and what comes next', () => {
    const history = [result(1, 20, 97), result(2, 30, 90), result(2, 18, 96), result(3, 10, 99), { mode: 'time', amount: 30, wpm: 60, accuracy: 98 }]
    const progress = lessonProgress(history)
    expect(progress.slice(0, 4).map((p) => p.passed)).toEqual([true, true, false, false])
    expect(progress[1]).toMatchObject({ attempts: 2, best: { wpm: 30 } }) // best = fastest attempt
    expect(nextLessonNumber(progress)).toBe(3)
  })

  it('starts at lesson 1 and ends on the review lesson', () => {
    expect(nextLessonNumber(lessonProgress([]))).toBe(1)
    const all = LESSONS.map((_, i) => result(i + 1, 40, 99))
    expect(nextLessonNumber(lessonProgress(all))).toBe(LESSONS.length)
  })
})
