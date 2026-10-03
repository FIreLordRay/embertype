/**
 * The test modes offered in the nav bar.
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
  // Drills built from your weakest keys (see lib/practice.js).
  practice: { label: 'practice', options: [10, 25, 50], setting: 'practiceCount', unit: 'words' },
}

/**
 * @typedef {{
 *   mode: 'time' | 'words' | 'practice',
 *   duration: number,
 *   wordCount: number,
 *   practiceCount: number,
 *   theme: string,
 * }} Settings
 */

/** @type {Settings} */
export const DEFAULT_SETTINGS = {
  mode: 'time',
  duration: 60,
  wordCount: 25,
  practiceCount: 25,
  theme: 'ember',
}

/** The length setting for the current mode: seconds in time mode, a word count otherwise. */
export function modeAmount(settings) {
  return settings[MODES[settings.mode].setting]
}
