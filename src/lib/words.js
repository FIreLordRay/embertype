/**
 * Pick `count` random words from `list`, never placing the same word twice in a row.
 *
 * `rng` is injectable so tests can pass a seeded generator and get the same words every run.
 *
 * @param {readonly string[]} list
 * @param {number} count
 * @param {() => number} [rng=Math.random] returns a float in [0, 1)
 * @returns {string[]}
 */
export function generateWords(list, count, rng = Math.random) {
  const words = []
  for (let i = 0; i < count; i++) {
    let index = Math.floor(rng() * list.length)
    // Same as the previous word? Take its neighbour instead of re-rolling: re-rolling
    // would loop forever on a broken rng that keeps returning the same number.
    if (list.length > 1 && list[index] === words[i - 1]) index = (index + 1) % list.length
    words.push(list[index])
  }
  return words
}
