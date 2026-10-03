import { createContext, useContext } from 'react'
import { DEFAULT_SETTINGS, MODES } from '../config/modes.js'
import { THEME_IDS } from '../config/themes.js'

export const STORAGE_KEY = 'embertype:settings'

/**
 * @typedef {import('../config/modes.js').Settings & {
 *   update: (patch: Partial<import('../config/modes.js').Settings>) => void
 * }} SettingsValue
 */

/** @type {import('react').Context<SettingsValue | null>} */
export const SettingsContext = createContext(null)

/** The global settings plus `update(patch)`. Use it anywhere under <SettingsProvider>. */
export function useSettings() {
  const settings = useContext(SettingsContext)
  if (!settings) throw new Error('useSettings() must be used inside <SettingsProvider>')
  return settings
}

/**
 * Saved settings can be stale (an option was removed) or hand-edited, so keep only the
 * values the app still supports and fall back to the defaults for everything else.
 *
 * @param {unknown} saved
 * @returns {import('../config/modes.js').Settings}
 */
export function sanitizeSettings(saved) {
  const settings = { ...DEFAULT_SETTINGS }
  if (!saved || typeof saved !== 'object') return settings
  // Object.hasOwn, not `in`: `'toString' in MODES` is true via the prototype chain.
  if (Object.hasOwn(MODES, saved.mode)) settings.mode = saved.mode
  // Each mode's length setting (duration, wordCount, practiceCount) must be one of its options.
  for (const { options, setting } of Object.values(MODES)) {
    if (options.includes(saved[setting])) settings[setting] = saved[setting]
  }
  if (THEME_IDS.includes(saved.theme)) settings.theme = saved.theme
  return settings
}

export function loadSettings() {
  try {
    return sanitizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY)))
  } catch {
    return { ...DEFAULT_SETTINGS } // storage blocked, or corrupt JSON
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Private browsing or storage full: settings just won't survive a reload.
  }
}
