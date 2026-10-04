import { createContext, useContext } from 'react'
import { BOOLEAN_SETTINGS, DAILY_GOALS, DEFAULT_SETTINGS, MODES } from '../config/modes.js'
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
  // Each mode's length setting (duration, wordCount, quoteLength, …) must be one of its options.
  for (const { options, setting } of Object.values(MODES)) {
    if (options.includes(saved[setting])) settings[setting] = saved[setting]
  }
  for (const key of BOOLEAN_SETTINGS) {
    if (typeof saved[key] === 'boolean') settings[key] = saved[key]
  }
  if (DAILY_GOALS.includes(saved.dailyGoal)) settings.dailyGoal = saved.dailyGoal
  if (THEME_IDS.includes(saved.theme)) settings.theme = saved.theme
  return settings
}

/**
 * The settings as a small external store, for useSyncExternalStore.
 *
 * A change is saved the moment it's made. Opening the app, or another tab saving, only reads:
 * if loading wrote back too, two open tabs (even two versions of the app) could keep
 * overwriting each other.
 *
 * @param {() => Storage} getStorage  a function, because merely touching localStorage can throw
 */
export function createSettingsStore(getStorage) {
  const listeners = new Set()
  let settings = read()

  function read() {
    try {
      return sanitizeSettings(JSON.parse(getStorage().getItem(STORAGE_KEY)))
    } catch {
      return { ...DEFAULT_SETTINGS } // storage blocked, or corrupt JSON
    }
  }

  function emit(next) {
    if (JSON.stringify(next) === JSON.stringify(settings)) return
    settings = next
    for (const listener of listeners) listener()
  }

  return {
    /** @param {() => void} listener */
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    getSnapshot: () => settings,

    /** @param {Partial<import('../config/modes.js').Settings>} patch */
    update(patch) {
      const next = sanitizeSettings({ ...settings, ...patch })
      try {
        getStorage().setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Private browsing or storage full: the change lasts until the tab closes.
      }
      emit(next)
    },

    /** Another tab changed a setting: follow it. */
    reload() {
      emit(read())
    },
  }
}
