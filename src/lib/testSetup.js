/**
 * Decides what a new test contains: its words, its time limit, and (for practice) the keys it
 * targets. <TypingTest> calls this once when it mounts, and every new test is a new mount.
 *
 * Keeping it here, outside the engine, separates "what to type" from "how typing works":
 * the engine never needs to know where its words came from.
 */
import { ENGLISH_200 } from '../data/english.js'
import { PRACTICE_WORDS } from '../data/practiceWords.js'
import { generatePracticeWords, practiceTargets } from './practice.js'
import { generateWords } from './words.js'

/** Time mode gets enough words that nobody runs out: 6 words a second ≈ 360 wpm. */
export const MAX_WORDS_PER_SECOND = 6

/**
 * @param {{ mode: 'time' | 'words' | 'practice', amount: number }} test
 *   amount = seconds in time mode, a word count otherwise
 * @param {import('./history.js').TestResult[]} results saved history; practice targets come from it
 * @param {() => number} [rng=Math.random]
 * @returns {{ words: string[], timeLimitMs: number | null, targets: { char: string, rate: number }[] }}
 */
export function buildTest({ mode, amount }, results, rng = Math.random) {
  if (mode === 'time') {
    return {
      words: generateWords(ENGLISH_200, amount * MAX_WORDS_PER_SECOND, rng),
      timeLimitMs: amount * 1000,
      targets: [],
    }
  }
  if (mode === 'practice') {
    const targets = practiceTargets(results)
    return { words: generatePracticeWords(PRACTICE_WORDS, targets, amount, rng), timeLimitMs: null, targets }
  }
  return { words: generateWords(ENGLISH_200, amount, rng), timeLimitMs: null, targets: [] }
}
