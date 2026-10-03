/**
 * Practice drills: tests built from your weakest keys.
 *
 *   1. practiceTargets() picks your worst keys, by miss rate, from your regular tests.
 *   2. generatePracticeWords() fills each word slot by picking one of those keys (worse keys
 *      more often), then a real word that contains it.
 */
import { isTraining, keyStats } from './history.js'
import { generateWords } from './words.js'

/** How many keys one drill focuses on. More than this and the practice gets diluted. */
export const MAX_TARGETS = 5

/** Drill words are lowercase letters, joined by spaces: only these keys can be drilled. */
const DRILLABLE = /^[a-z ]$/

/**
 * The keys to drill: your highest miss rates in regular tests.
 *
 * Training doesn't count here (drills, and lessons with their few letters). Your real typing
 * decides what needs work, so a key only leaves the list when your regular tests show you've
 * improved on it. Capitals and symbols from quotes are skipped: drill words can't contain them.
 *
 * @param {import('./history.js').TestResult[]} results
 * @returns {{ char: string, attempts: number, misses: number, rate: number }[]} worst first
 */
export function practiceTargets(results, limit = MAX_TARGETS) {
  return keyStats(results.filter((result) => !isTraining(result)))
    .filter((key) => DRILLABLE.test(key.char))
    .slice(0, limit)
}

/**
 * Words for a drill. Each slot picks a target key with probability proportional to its miss
 * rate (a key missed twice as often shows up twice as often), then a random word containing
 * it. A weak space bar is drilled with short words, which have the most spaces per letter.
 *
 * With nothing to target yet (a brand-new user), it falls back to ordinary random words.
 *
 * @param {readonly string[]} list
 * @param {{ char: string, rate: number }[]} targets
 * @param {number} count
 * @param {() => number} [rng=Math.random] injectable so tests can use a seeded generator
 * @returns {string[]}
 */
export function generatePracticeWords(list, targets, count, rng = Math.random) {
  const pools = targets
    .map((target) => ({
      ...target,
      words: list.filter((word) => (target.char === ' ' ? word.length <= 3 : word.includes(target.char))),
    }))
    .filter((target) => target.rate > 0 && target.words.length > 0) // a key no word contains can't be drilled
  if (pools.length === 0) return generateWords(list, count, rng)

  const totalRate = pools.reduce((sum, target) => sum + target.rate, 0)
  const words = []
  for (let i = 0; i < count; i++) {
    // Pick a key: walk the rates until the random point lands inside one of them.
    let point = rng() * totalRate
    let target = pools.at(-1) // also catches floating-point rounding at the very end
    for (const candidate of pools) {
      if (point < candidate.rate) {
        target = candidate
        break
      }
      point -= candidate.rate
    }

    let index = Math.floor(rng() * target.words.length)
    // Never the same word twice in a row: take the neighbour (re-rolling could loop forever).
    if (target.words.length > 1 && target.words[index] === words[i - 1]) index = (index + 1) % target.words.length
    words.push(target.words[index])
  }
  return words
}
