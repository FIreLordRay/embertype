/**
 * The touch-typing course. Each lesson adds a few keys, in the order typing teachers use:
 * the home row first (where your fingers rest), then the top row, then the bottom row.
 * The last lesson reviews every letter with real words.
 *
 * `keys` are the new letters a lesson introduces; earlier lessons' letters stay in play.
 */
export const LESSONS = [
  { keys: 'fj', row: 'home row', title: 'index fingers' },
  { keys: 'dk', row: 'home row', title: 'middle fingers' },
  { keys: 'sl', row: 'home row', title: 'ring fingers' },
  { keys: 'a', row: 'home row', title: 'left pinky' },
  { keys: 'gh', row: 'home row', title: 'index stretch' },
  { keys: 'ei', row: 'top row', title: 'middle fingers' },
  { keys: 'ru', row: 'top row', title: 'index fingers' },
  { keys: 'ty', row: 'top row', title: 'index stretch' },
  { keys: 'wo', row: 'top row', title: 'ring fingers' },
  { keys: 'qp', row: 'top row', title: 'pinkies' },
  { keys: 'nm', row: 'bottom row', title: 'right index' },
  { keys: 'vb', row: 'bottom row', title: 'left index' },
  { keys: 'cx', row: 'bottom row', title: 'left middle and ring' },
  { keys: 'z', row: 'bottom row', title: 'left pinky' },
  { keys: '', row: 'review', title: 'every letter' },
]

/** Words per lesson. */
export const LESSON_LENGTH = 25

/** To pass a lesson: accurate first, then reasonably quick. */
export const PASS_ACCURACY = 95
export const PASS_WPM = 15
