/**
 * The touch-typing course: which letters each lesson uses, the words to practice them with,
 * and whether you've passed. Progress is never stored separately: it's worked out from your
 * saved lesson results, so it can't get out of sync with them.
 */
import { LESSON_LENGTH, LESSONS, PASS_ACCURACY, PASS_WPM } from '../config/lessons.js'
import { ENGLISH_200 } from '../data/english.js'
import { PRACTICE_WORDS } from '../data/practiceWords.js'

const ALL_WORDS = [...new Set([...ENGLISH_200, ...PRACTICE_WORDS])]

/** Real words are used once a lesson has at least this many containing its new keys. */
const MIN_REAL_WORDS = 10

/**
 * Every letter introduced up to and including lesson `n` (lessons are numbered from 1).
 *
 * @param {number} n
 * @returns {Set<string>}
 */
export function knownLetters(n) {
  return new Set(LESSONS.slice(0, n).flatMap((lesson) => [...lesson.keys]))
}

/**
 * The words for lesson `n`:
 *  - real words that use only the letters learned so far: 70% containing the new keys, 30%
 *    reviewing earlier letters
 *  - early lessons know too few letters for real words (measured: lessons 1–3 have none), so
 *    they use short letter groups like "fjf" or "jdk", the classic first drills. Lessons with
 *    only a handful of real words mix the two half and half.
 *
 * @param {number} n lesson number (1-based)
 * @param {() => number} [rng=Math.random]
 * @param {number} [count=LESSON_LENGTH]
 * @returns {string[]}
 */
export function lessonWords(n, rng = Math.random, count = LESSON_LENGTH) {
  const known = knownLetters(n)
  const knownList = [...known]
  const fresh = LESSONS[n - 1].keys ? [...LESSONS[n - 1].keys] : knownList // the review lesson: everything
  const real = ALL_WORDS.filter((word) => [...word].every((c) => known.has(c)))
  const withFresh = real.filter((word) => fresh.some((c) => word.includes(c)))

  const realShare = withFresh.length >= MIN_REAL_WORDS ? 1 : withFresh.length > 0 ? 0.5 : 0
  const pick = (list) => list[Math.floor(rng() * list.length)]
  const drill = () => {
    const length = 2 + Math.floor(rng() * 3) // 2 to 4 letters
    let word = ''
    for (let i = 0; i < length; i++) word += rng() < 0.6 ? pick(fresh) : pick(knownList)
    return word
  }

  const words = []
  for (let i = 0; i < count; i++) {
    let word
    for (let tries = 0; tries < 5; tries++) {
      if (rng() >= realShare) word = drill()
      else word = realShare === 1 && rng() < 0.3 ? pick(real) : pick(withFresh)
      if (word !== words[i - 1]) break // avoid the same word twice in a row (give up after 5 tries)
    }
    words.push(word)
  }
  return words
}

/**
 * Did this lesson result pass? Accuracy comes first: speed without accuracy builds bad habits.
 *
 * @param {{ accuracy: number, wpm: number }} result
 */
export function lessonPassed(result) {
  return result.accuracy >= PASS_ACCURACY && result.wpm >= PASS_WPM
}

/**
 * Your progress through the course, worked out from saved results.
 *
 * @param {import('./history.js').TestResult[]} results
 * @returns {{ passed: boolean, attempts: number, best: import('./history.js').TestResult | null }[]}
 *   one entry per lesson, in order
 */
export function lessonProgress(results) {
  const progress = LESSONS.map(() => ({ passed: false, attempts: 0, best: null }))
  for (const result of results) {
    if (result.mode !== 'lesson') continue
    const entry = progress[result.amount - 1]
    if (!entry) continue // a lesson that no longer exists
    entry.attempts++
    if (!entry.best || result.wpm > entry.best.wpm) entry.best = result
    if (lessonPassed(result)) entry.passed = true
  }
  return progress
}

/**
 * The lesson to do next: the first one not passed yet (or the review lesson once all are).
 *
 * @param {ReturnType<typeof lessonProgress>} progress
 */
export function nextLessonNumber(progress) {
  const index = progress.findIndex((entry) => !entry.passed)
  return index === -1 ? progress.length : index + 1
}
