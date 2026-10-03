/**
 * The US QWERTY keyboard: its rows, which finger presses each key (the standard touch-typing
 * assignment), and how to type the characters that need Shift.
 * Shared by the finger guide (typing screen) and the key heatmap (stats page).
 */

/** Character keys, row by row, top to bottom. */
export const ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
]

/** Where your fingers rest. F and J have bumps so you can find them without looking. */
export const HOME_KEYS = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';']

/** Keys drawn only for the keyboard's shape: nothing in embertype is typed with them. */
export const DECORATIVE_KEYS = ['backspace', 'tab', 'caps', 'enter']

/** Keys pressed by each finger (columns of the keyboard, roughly diagonal). */
const FINGER_KEYS = {
  'left pinky': '`1qaz',
  'left ring': '2wsx',
  'left middle': '3edc',
  'left index': '45rtfgvb',
  'right index': '67yuhjnm',
  'right middle': '8ik,',
  'right ring': '9ol.',
  'right pinky': "0-=p[]\\;'/",
}

// A Map, not a plain object: FINGER_OF['toString'] on an object would find a built-in function.
const FINGER_OF = new Map(
  Object.entries(FINGER_KEYS).flatMap(([finger, keys]) => [...keys].map((key) => [key, finger])),
)

/** Characters typed with Shift, mapped to the key that produces them. */
const SHIFTED = {
  '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8',
  '(': '9', ')': '0', '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'",
  '<': ',', '>': '.', '?': '/',
}

/** Every key a given finger is responsible for. */
export function keysForFinger(finger) {
  return Object.hasOwn(FINGER_KEYS, finger) ? FINGER_KEYS[finger] : ''
}

/**
 * How to type a character: the key, the finger that presses it, and which Shift to hold.
 * Touch typists hold the Shift on the *opposite* hand, so the other hand stays free.
 *
 * @param {string} char
 * @returns {{ key: string, finger: string, shift: 'left' | 'right' | null } | null}
 *   null for characters a US keyboard can't type directly
 */
export function keyFor(char) {
  if (char === ' ') return { key: ' ', finger: 'thumb', shift: null }

  let key = char
  let shifted = false
  if (char >= 'A' && char <= 'Z') {
    key = char.toLowerCase()
    shifted = true
  } else if (Object.hasOwn(SHIFTED, char)) {
    key = SHIFTED[char]
    shifted = true
  }

  const finger = FINGER_OF.get(key)
  if (!finger) return null
  return { key, finger, shift: shifted ? (finger.startsWith('left') ? 'right' : 'left') : null }
}
