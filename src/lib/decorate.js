/**
 * Punctuation and numbers for time and words tests: real typing isn't all lowercase words.
 *
 *  - numbers:      about 1 word in 8 becomes a number with 1–4 digits
 *  - punctuation:  sentences start with a capital and end with . ? or !; commas appear often,
 *                  and now and then a ; : "quote", (bracket), apostrophe-s or a dash
 */

const NUMBER_SHARE = 0.12

/**
 * @param {string[]} words plain lowercase words
 * @param {{ punctuation?: boolean, numbers?: boolean }} extras
 * @param {() => number} [rng=Math.random]
 * @returns {string[]} the same words, decorated (a dash is its own entry: "word - word")
 */
export function decorateWords(words, { punctuation = false, numbers = false } = {}, rng = Math.random) {
  if (!punctuation && !numbers) return words

  const out = []
  let sentenceStart = true
  for (let i = 0; i < words.length; i++) {
    let word = numbers && rng() < NUMBER_SHARE ? randomNumber(rng) : words[i]
    if (!punctuation) {
      out.push(word)
      continue
    }

    if (sentenceStart) word = word[0].toUpperCase() + word.slice(1) // digits are unaffected
    sentenceStart = false

    if (i === words.length - 1) {
      out.push(`${word}.`) // the text always ends a sentence
      continue
    }

    const roll = rng()
    if (roll < 0.08) {
      word += ['.', '.', '.', '?', '!'][Math.floor(rng() * 5)]
      sentenceStart = true
    } else if (roll < 0.17) word += ','
    else if (roll < 0.19) word += ';'
    else if (roll < 0.21) word += ':'
    else if (roll < 0.235) word = `"${word}"`
    else if (roll < 0.26) word = `(${word})`
    else if (roll < 0.28 && /^[a-z]+$/i.test(word)) word += "'s"
    else if (roll < 0.3) {
      out.push(word)
      word = '-' // a dash between two words
    }
    out.push(word)
  }
  return out
}

function randomNumber(rng) {
  const digits = 1 + Math.floor(rng() * 4)
  const min = digits === 1 ? 0 : 10 ** (digits - 1) // no leading zeros
  return String(min + Math.floor(rng() * (10 ** digits - min)))
}
