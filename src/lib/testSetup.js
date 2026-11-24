/**
 * Decides what a new test contains: its words, its time limit, and depending on the mode the
 * practice targets, the quote, or the personal-best pace to race. <TypingTest> calls this once
 * when it mounts, and every new test is a new mount.
 *
 * Keeping it here, outside the engine, separates "what to type" from "how typing works":
 * the engine never needs to know where its words came from.
 */
import { EXTRAS_MODES, TRAINING_MODES } from '../config/modes.js'
import { ENGLISH_200 } from '../data/english.js'
import { PRACTICE_WORDS } from '../data/practiceWords.js'
import { TECH_WORDS } from '../data/tech.js'
import { decorateWords } from './decorate.js'
import { previousBest } from './history.js'
import { lessonWords } from './lessons.js'
import { generatePracticeWords, practiceTargets } from './practice.js'
import { pickQuote } from './quotes.js'
import { generateWords } from './words.js'

/** Time mode gets enough words that nobody runs out: 6 words a second ≈ 360 wpm. */
export const MAX_WORDS_PER_SECOND = 6

/**
 * @typedef {Object} TestSetup
 * @property {string[]} words
 * @property {number | null} timeLimitMs                time mode only
 * @property {{ char: string, rate: number }[]} targets  practice only: the keys being drilled
 * @property {{ text: string, author: string } | null} quote
 * @property {number | null} pace   the personal best (wpm) to race, if there is one
 * @property {{ punctuation?: boolean, numbers?: boolean, tech?: boolean }} extras  what was mixed into the words
 */

/**
 * @param {{ mode: 'time' | 'words' | 'quote' | 'practice' | 'lesson', amount: number | string,
 *           punctuation?: boolean, numbers?: boolean, tech?: boolean, paceCaret?: boolean }} test
 *   amount = seconds (time), a word count (words, practice), a quote length, or a lesson number
 * @param {import('./history.js').TestResult[]} results saved history (practice targets, pace)
 * @param {() => number} [rng=Math.random]
 * @returns {TestSetup}
 */
export function buildTest({ mode, amount, punctuation = false, numbers = false, tech = false, paceCaret = false }, results, rng = Math.random) {
  const extras = EXTRAS_MODES.includes(mode) ? { punctuation, numbers, tech } : {}
  const list = extras.tech ? TECH_WORDS : ENGLISH_200
  const setup = { words: [], timeLimitMs: null, targets: [], quote: null, pace: null, extras }

  switch (mode) {
    case 'time':
      setup.words = decorateWords(generateWords(list, amount * MAX_WORDS_PER_SECOND, rng), extras, rng)
      setup.timeLimitMs = amount * 1000
      break
    case 'words':
      setup.words = decorateWords(generateWords(list, amount, rng), extras, rng)
      break
    case 'quote':
      setup.quote = pickQuote(amount, rng)
      setup.words = setup.quote.text.split(' ')
      break
    case 'practice':
      setup.targets = practiceTargets(results)
      setup.words = generatePracticeWords(PRACTICE_WORDS, setup.targets, amount, rng)
      break
    case 'lesson':
      setup.words = lessonWords(amount, rng)
      break
    default:
      throw new Error(`Unknown test mode: ${mode}`)
  }

  // Race your best: the personal best for exactly this test (same mode, length and extras).
  // Training has no bests, so nothing to race there.
  if (paceCaret && !TRAINING_MODES.includes(mode)) {
    setup.pace = previousBest(results, `${mode} ${amount}`, null, extras)
  }
  return setup
}
