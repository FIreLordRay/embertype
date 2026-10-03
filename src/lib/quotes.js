/**
 * Quote mode: pick a quote of the chosen length.
 */
import { QUOTES } from '../data/quotes.js'

/** Length groups by character count: short ≤ 100, medium ≤ 250, long above that. */
export function quoteLength(text) {
  if (text.length <= 100) return 'short'
  if (text.length <= 250) return 'medium'
  return 'long'
}

/**
 * A random quote from one length group.
 *
 * @param {'short' | 'medium' | 'long'} length
 * @param {() => number} [rng=Math.random]
 * @returns {{ text: string, author: string }}
 */
export function pickQuote(length, rng = Math.random) {
  const group = QUOTES.filter((quote) => quoteLength(quote.text) === length)
  return group[Math.floor(rng() * group.length)]
}
