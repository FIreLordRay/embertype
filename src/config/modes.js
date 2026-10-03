import { LESSONS } from './lessons.js'

/**
 * The test modes offered in the mode bar.
 *
 *   options   the lengths to choose from (edit these to change the choices)
 *   setting   which setting stores the chosen length
 *   unit      what the length counts, for screen readers and labels
 *
 * Stored settings that no longer match an option fall back to the defaults below.
 */
export const MODES = {
  time: { label: 'time', options: [15, 30, 60], setting: 'duration', unit: 'seconds' },
  words: { label: 'words', options: [10, 25, 50], setting: 'wordCount', unit: 'words' },
  // Real sentences with capitals and punctuation (see data/quotes.js), grouped by length.
  quote: { label: 'quote', options: ['short', 'medium', 'long'], setting: 'quoteLength', unit: 'length' },
  // Drills built from your weakest keys (see lib/practice.js).
  practice: { label: 'practice', options: [10, 25, 50], setting: 'practiceCount', unit: 'words' },
  // The touch-typing course (see config/lessons.js); the "length" is the lesson number.
  lesson: { label: 'learn', options: LESSONS.map((_, i) => i + 1), setting: 'lesson', unit: 'lesson' },
}

/**
 * Training modes use words picked to be hard (practice) or limited to a few letters (lessons),
 * so their speeds aren't comparable with normal tests: they stay out of "all", personal bests
 * and the speed trend, and get their own filters on the stats page.
 */
export const TRAINING_MODES = ['practice', 'lesson']

/** Modes whose words can get punctuation and numbers mixed in. */
export const EXTRAS_MODES = ['time', 'words']

/** Daily practice goal choices, in minutes. */
export const DAILY_GOALS = [5, 10, 15, 20, 30]

/**
 * @typedef {{
 *   mode: 'time' | 'words' | 'quote' | 'practice' | 'lesson',
 *   duration: number, wordCount: number, quoteLength: 'short' | 'medium' | 'long',
 *   practiceCount: number, lesson: number,
 *   punctuation: boolean, numbers: boolean,
 *   theme: string,
 *   fingerGuide: boolean, paceCaret: boolean, sound: boolean, dailyGoal: number,
 * }} Settings
 */

/** @type {Settings} */
export const DEFAULT_SETTINGS = {
  mode: 'time',
  duration: 60,
  wordCount: 25,
  quoteLength: 'medium',
  practiceCount: 25,
  lesson: 1,
  punctuation: false,
  numbers: false,
  theme: 'ember',
  fingerGuide: true, // the on-screen keyboard showing which finger to use
  paceCaret: true, // the ghost caret racing your personal best
  sound: false,
  dailyGoal: 10,
}

/** On/off settings: anything that isn't a real boolean falls back to the default. */
export const BOOLEAN_SETTINGS = ['punctuation', 'numbers', 'fingerGuide', 'paceCaret', 'sound']

/** The length setting for the current mode: seconds in time mode, a word count, quote length or lesson. */
export function modeAmount(settings) {
  return settings[MODES[settings.mode].setting]
}
